import { createContext, useContext, useEffect, useState } from 'react';

import type { Track } from '@/lib/api';
import { logError } from '@/lib/error-log';

const KEY_FAVORITES = 'arabeplayer.favorites';
const KEY_HISTORY = 'arabeplayer.history';
const KEY_PLAYLISTS = 'arabeplayer.playlists';

export type Playlists = Record<string, Track[]>;

export function useLibraryState() {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlists>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (
          await import('expo-sqlite/kv-store')
        ).default;
        const [fav, hist, lists] = await Promise.all([
          AsyncStorage.getItem(KEY_FAVORITES),
          AsyncStorage.getItem(KEY_HISTORY),
          AsyncStorage.getItem(KEY_PLAYLISTS),
        ]);
        if (fav) setFavorites(JSON.parse(fav));
        if (hist) setHistory(JSON.parse(hist));
        if (lists) setPlaylists(JSON.parse(lists));
      } catch (e) {
        logError('biblioteca (AsyncStorage)', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (key: string, value: unknown) => {
    try {
      const AsyncStorage = (await import('expo-sqlite/kv-store')).default;
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      logError('guardar biblioteca', e);
    }
  };

  const toggleFavorite = (track: Track) => {
    setFavorites((prev) => {
      const next = prev.some((t) => t.id === track.id)
        ? prev.filter((t) => t.id !== track.id)
        : [track, ...prev];
      void persist(KEY_FAVORITES, next);
      return next;
    });
  };

  const addToHistory = (track: Track) => {
    setHistory((prev) => {
      const next = [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 50);
      void persist(KEY_HISTORY, next);
      return next;
    });
  };

  const addToPlaylist = (name: string, track: Track) => {
    setPlaylists((prev) => {
      const list = prev[name] ?? [];
      if (list.some((t) => t.id === track.id)) return prev;
      const next = { ...prev, [name]: [...list, track] };
      void persist(KEY_PLAYLISTS, next);
      return next;
    });
  };

  const createPlaylist = (name: string) => {
    setPlaylists((prev) => {
      if (prev[name]) return prev;
      const next = { ...prev, [name]: [] };
      void persist(KEY_PLAYLISTS, next);
      return next;
    });
  };

  const removeFromPlaylist = (name: string, trackId: string) => {
    setPlaylists((prev) => {
      const next = { ...prev, [name]: (prev[name] ?? []).filter((t) => t.id !== trackId) };
      void persist(KEY_PLAYLISTS, next);
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.some((t) => t.id === id);

  return {
    loaded,
    favorites,
    history,
    playlists,
    toggleFavorite,
    isFavorite,
    addToHistory,
    addToPlaylist,
    createPlaylist,
    removeFromPlaylist,
  };
}

export type LibraryState = ReturnType<typeof useLibraryState>;

export const LibraryContext = createContext<LibraryState | null>(null);

export function useLibrary(): LibraryState {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary debe usarse dentro de LibraryContext.Provider');
  return ctx;
}
