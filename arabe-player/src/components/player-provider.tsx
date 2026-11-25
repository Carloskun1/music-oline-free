import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { formatDuration, getAudioUrl, type Track } from '@/lib/api';

type PlayerState = {
  current: Track | null;
  isPlaying: boolean;
  loading: boolean;
  position: number;
  duration: number;
  error: string | null;
  play: (track: Track) => Promise<void>;
  toggle: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  stop: () => Promise<void>;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer debe usarse dentro de PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children, onPlayTrack }: { children: ReactNode; onPlayTrack?: (track: Track) => void }) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return () => {
      playerRef.current?.release();
      playerRef.current = null;
    };
  }, []);

  const play = useCallback(
    async (track: Track) => {
      setError(null);
      setLoading(true);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setCurrent(track);
      try {
        playerRef.current?.release();
        playerRef.current = null;
        const url = await getAudioUrl(track.id);
        const player = createAudioPlayer({ uri: url });
        playerRef.current = player;
        player.addListener('playbackStatusUpdate', (status) => {
          setPosition(status.currentTime ?? 0);
          setDuration(status.duration ?? 0);
          setIsPlaying(Boolean(status.playing));
        });
        player.play();
        onPlayTrack?.(track);
      } catch {
        setError('No se pudo cargar esta pista. Prueba con otra canción.');
        setIsPlaying(false);
      } finally {
        setLoading(false);
      }
    },
    [onPlayTrack],
  );

  const toggle = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.playing) player.pause();
    else player.play();
  }, []);

  const seek = useCallback(async (seconds: number) => {
    await playerRef.current?.seekTo(seconds);
  }, []);

  const stop = useCallback(async () => {
    playerRef.current?.release();
    playerRef.current = null;
    setCurrent(null);
    setPosition(0);
    setDuration(0);
    setIsPlaying(false);
  }, []);

  const value = useMemo(
    () => ({
      current,
      isPlaying: isPlaying && !loading,
      position,
      duration,
      loading,
      error,
      play,
      toggle,
      seek,
      stop,
    }),
    [current, isPlaying, loading, position, duration, error, play, toggle, seek, stop],
  );

  return (
    <PlayerContext.Provider value={value}>
      <View style={styles.fill}>{children}</View>
      <MiniPlayer />
    </PlayerContext.Provider>
  );
}
export function MiniPlayer() {
  const { current, isPlaying, loading, toggle, stop, position, duration, error } = usePlayer();
  if (!current) return null;
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <View style={styles.mini}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { flex: progress }]} />
        <View style={[styles.progressRest, { flex: 1 - progress }]} />
      </View>
      {current.thumbnail ? (
        <Image source={{ uri: current.thumbnail }} style={styles.miniArt} />
      ) : (
        <View style={[styles.miniArt, styles.miniArtPlaceholder]} />
      )}
      <View style={styles.miniInfo}>
        <Text numberOfLines={1} style={styles.miniTitle}>
          {current.title}
        </Text>
        <Text numberOfLines={1} style={styles.miniArtist}>
          {current.uploader} · {formatDuration(current.duration)}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.dark.accent} style={styles.miniBtn} />
      ) : (
        <Pressable
          accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
          onPress={() => void toggle()}
          style={({ pressed }) => [styles.miniBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.miniBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityLabel="Cerrar reproductor"
        onPress={() => void stop()}
        style={({ pressed }) => [styles.miniBtn, pressed && { opacity: 0.7 }]}>
        <Text style={[styles.miniBtnText, { color: Colors.dark.textSecondary }]}>✕</Text>
      </Pressable>
      {error ? (
        <Text numberOfLines={1} style={styles.miniError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  mini: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.dark.backgroundElement,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  progressBar: {
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    height: 2,
    flexDirection: 'row',
  },
  progressFill: { backgroundColor: Colors.dark.accent },
  progressRest: { backgroundColor: Colors.dark.border },
  miniArt: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.dark.backgroundSelected },
  miniArtPlaceholder: {},
  miniInfo: { flex: 1, minWidth: 0 },
  miniTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: '600' },
  miniArtist: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  miniBtn: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  miniBtnText: { color: Colors.dark.heading, fontSize: 22 },
  miniError: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.three,
    color: Colors.dark.danger,
    fontSize: 10,
  },
});
