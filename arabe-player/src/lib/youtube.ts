// Búsqueda y tendencias con la API oficial de YouTube Data v3.
// La clave llega por el secreto de GitHub YOUTUBE_API_KEY (ver .github/workflows/main.yml).
import type { Track } from '@/lib/api';

// Si existe el secreto de GitHub se usa ese; si no, la clave de respaldo escrita aquí.
const KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyB50ww-iqQ0GuD_T8UBPXKdXpuvus3NBFE';
export const hasYoutubeKey = KEY.length > 0;

const cache = new Map<string, { at: number; tracks: Track[] }>();
const TTL = 10 * 60 * 1000;

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseDuration(iso: string | undefined): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '');
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

async function yt<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, key: KEY }).toString();
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${qs}`);
  if (!res.ok) {
    let detail = '';
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      detail = j.error?.message ?? '';
    } catch {}
    throw new Error(`YouTube HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  return (await res.json()) as T;
}

type Thumbs = { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
type VideoItem = {
  id: string;
  snippet: { title: string; channelTitle: string; thumbnails?: Thumbs };
  contentDetails?: { duration?: string };
};

function toTrack(v: VideoItem): Track | null {
  const duration = parseDuration(v.contentDetails?.duration);
  if (!v.id || duration <= 0 || duration > 3 * 3600) return null; // sin directos (duración 0)
  const t = v.snippet.thumbnails;
  return {
    id: v.id,
    title: decode(v.snippet.title),
    uploader: decode(v.snippet.channelTitle).replace(/ - Topic$/, ''),
    duration,
    thumbnail: t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? '',
    source: 'youtube',
  };
}

export async function searchYoutube(query: string): Promise<Track[]> {
  const hit = cache.get(`s:${query}`);
  if (hit && Date.now() - hit.at < TTL) return hit.tracks;
  const search = await yt<{ items?: { id?: { videoId?: string } }[] }>('search', {
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    maxResults: '40',
    q: query,
  });
  const ids = (search.items ?? []).map((i) => i.id?.videoId).filter((x): x is string => !!x);
  if (ids.length === 0) return [];
  const videos = await yt<{ items?: VideoItem[] }>('videos', {
    part: 'snippet,contentDetails',
    id: ids.join(','),
  });
  const tracks = (videos.items ?? []).map(toTrack).filter((t): t is Track => t !== null);
  cache.set(`s:${query}`, { at: Date.now(), tracks });
  return tracks;
}

export async function trendingYoutube(region = 'CO'): Promise<Track[]> {
  const hit = cache.get(`t:${region}`);
  if (hit && Date.now() - hit.at < TTL) return hit.tracks;
  let tracks: Track[] = [];
  try {
    const videos = await yt<{ items?: VideoItem[] }>('videos', {
      part: 'snippet,contentDetails',
      chart: 'mostPopular',
      videoCategoryId: '10',
      regionCode: region,
      maxResults: '30',
    });
    tracks = (videos.items ?? []).map(toTrack).filter((t): t is Track => t !== null);
  } catch (e) {
    // Si la lista de música populares no está disponible en tu región, se busca igual.
    if (e instanceof Error && /HTTP (400|403)/.test(e.message) && /key|quota|API/i.test(e.message)) throw e;
  }
  if (tracks.length === 0) tracks = await searchYoutube('música popular canciones más escuchadas');
  cache.set(`t:${region}`, { at: Date.now(), tracks });
  return tracks;
}
