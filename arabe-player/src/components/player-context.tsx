import { createContext, useContext } from 'react';

import { MINI_PLAYER } from '@/constants/theme';
import type { Track } from '@/lib/api';

export type RepeatMode = 'off' | 'all' | 'one';

export type PlayerState = {
  current: Track | null;
  isPlaying: boolean;
  loading: boolean;
  position: number; // segundos
  duration: number; // segundos
  error: string | null;
  queue: Track[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  nowPlayingOpen: boolean;
  play: (track: Track, list?: Track[]) => Promise<void>;
  playAll: (tracks: Track[], shuffle?: boolean) => Promise<void>;
  toggle: () => void;
  seek: (seconds: number) => Promise<void>;
  next: () => void;
  prev: () => void;
  stop: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
};

export const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer debe usarse dentro de PlayerProvider');
  return ctx;
}

// Espacio extra al final de las listas para que el mini reproductor no tape canciones.
export function useListBottomPad(extra = 16): number {
  const { current } = usePlayer();
  return extra + (current ? MINI_PLAYER : 0);
}
