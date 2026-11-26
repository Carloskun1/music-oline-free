// Cliente de Audius (API pública y gratuita de música). Reemplaza a Piped, que devolvía HTTP 403.
import { logError } from '@/lib/error-log';
import { hasYoutubeKey, searchYoutube, trendingYoutube } from '@/lib/youtube';

const APP_NAME = 'arabe-player';
const FALLBACK_HOSTS = ['https://api.audius.co', 'https://discoveryprovider.audius.co'];

export type Track = {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  source?: 'youtube' | 'audius';
};

type AudiusTrack = {
  id?: string;
  title?: string;
  duration?: number;
  is_streamable?: boolean;
  artwork?: { '150x150'?: string; '480x480'?: string; '1000x1000'?: string } | null;
  user?: { name?: string; handle?: string };
};

let hostsCache: string[] | null = null;

async function getHosts(): Promise<string[]> {
  if (hostsCache) return hostsCache;
  let discovered: string[] = [];
  try {
    const res = await fetch('https://api.audius.co');
    if (res.ok) {
      const json = (await res.json()) as { data?: string[] };
      discovered = (json.data ?? []).filter((h) => typeof h === 'string').slice(0, 4);
    }
  } catch {
    // seguimos con los hosts de respaldo
  }
  hostsCache = [...FALLBACK_HOSTS, ...discovered];
  return hostsCache;
}

async function audiusFetch<T>(path: string): Promise<{ data: T; host: string }> {
  const sep = path.includes('?') ? '&' : '?';
  const errors: string[] = [];
  for (const host of await getHosts()) {
    try {
      const res = await fetch(`${host}/v1${path}${sep}app_name=${APP_NAME}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data: T };
      return { data: json.data, host };
    } catch (err) {
      errors.push(`${host}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`Audius no respondió. ${errors.join(' | ')}`);
}

function toTrack(t: AudiusTrack): Track | null {
  if (!t.id || !t.title || t.is_streamable === false) return null;
  return {
    id: t.id,
    title: t.title,
    uploader: t.user?.name ?? t.user?.handle ?? '',
    duration: t.duration ?? 0,
    thumbnail: t.artwork?.['480x480'] ?? t.artwork?.['150x150'] ?? '',
    source: 'audius',
  };
}

// YouTube es la fuente principal. Si no hay clave o falla, se usa Audius como respaldo.
export async function searchTracks(query: string): Promise<Track[]> {
  if (hasYoutubeKey) {
    try {
      return await searchYoutube(query);
    } catch (e) {
      logError('youtube (búsqueda)', e);
    }
  }
  return searchAudius(query);
}

async function searchAudius(query: string): Promise<Track[]> {
  const { data } = await audiusFetch<AudiusTrack[]>(`/tracks/search?query=${encodeURIComponent(query)}&limit=30`);
  return (data ?? []).map(toTrack).filter((t): t is Track => t !== null);
}

export async function getTrending(_region?: string): Promise<Track[]> {
  if (hasYoutubeKey) {
    try {
      return await trendingYoutube('CO');
    } catch (e) {
      logError('youtube (tendencias)', e);
    }
  }
  const { data } = await audiusFetch<AudiusTrack[]>('/tracks/trending?limit=30');
  return (data ?? []).map(toTrack).filter((t): t is Track => t !== null);
}

// Audius sirve el MP3 directo (con redirección) desde esta URL.
export async function getAudioUrl(id: string): Promise<string> {
  const hosts = await getHosts();
  return `${hosts[0]}/v1/tracks/${id}/stream?app_name=${APP_NAME}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
