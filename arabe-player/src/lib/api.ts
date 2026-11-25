// Cliente real de Piped (API pública de YouTube Music) con respaldo de instancias.
const INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.kavin.rocks',
];

export type Track = {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
};

type PipedItem = {
  url?: string;
  title?: string;
  uploaderName?: string;
  duration?: number;
  thumbnail?: string;
};

type PipedSearch = { items?: PipedItem[] };

type PipedStream = {
  audioStreams?: { url: string; bitrate: number; mimeType: string; format?: string }[];
  title?: string;
  uploader?: string;
  duration?: number;
  thumbnailUrl?: string;
};

function toTrack(item: PipedItem): Track | null {
  const id = item.url?.split('v=')[1] ?? item.url?.split('/watch?v=')[1];
  if (!id || !item.title) return null;
  return {
    id,
    title: item.title,
    uploader: item.uploaderName ?? '',
    duration: item.duration ?? 0,
    thumbnail: item.thumbnail ?? '',
  };
}

async function pipedFetch<T>(path: string): Promise<T> {
  let lastError: unknown;
  for (const base of INSTANCES) {
    try {
      return await pipedFetchFrom<T>(base, path);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Sin conexión con ninguna instancia');
}

export async function searchTracks(query: string): Promise<Track[]> {
  const data = await pipedFetch<PipedSearch>(
    `/search?q=${encodeURIComponent(query)}&filter=music_songs`,
  );
  return (data.items ?? []).map(toTrack).filter((t): t is Track => t !== null);
}

export async function getTrending(region = 'MX'): Promise<Track[]> {
  const data = await pipedFetch<PipedItem[] | { items?: PipedItem[] }>(`/trending?region=${region}`);
  const items = Array.isArray(data) ? data : (data.items ?? []);
  return items.map(toTrack).filter((t): t is Track => t !== null);
}

export async function getAudioUrl(id: string): Promise<string> {
  let lastError: unknown;
  for (const base of INSTANCES) {
    try {
      const data = await pipedFetchFrom(base, `/streams/${id}`) as PipedStream;
      const audio = (data.audioStreams ?? [])
        .filter((s) => s.mimeType.startsWith('audio/') && s.url)
        .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
      if (audio.length > 0) return audio[0].url;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Ninguna instancia pudo servir el audio de esta pista ahora mismo');
}

async function pipedFetchFrom<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
