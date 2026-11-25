import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { MiniPlayer } from '@/components/mini-player';
import { NowPlaying } from '@/components/now-playing';
import { PlayerContext, type PlayerState, type RepeatMode } from '@/components/player-context';
import { getAudioUrl, type Track } from '@/lib/api';
import { logError } from '@/lib/error-log';

export { usePlayer } from '@/components/player-context';

export function PlayerProvider({
  children,
  onPlayTrack,
}: {
  children: ReactNode;
  onPlayTrack?: (track: Track) => void;
}) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const tokenRef = useRef(0);
  const queueRef = useRef<Track[]>([]);
  const indexRef = useRef(-1);
  const historyRef = useRef<number[]>([]);
  const positionRef = useRef(0);
  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>('off');
  const endRef = useRef<() => void>(() => {});
  const onPlayRef = useRef(onPlayTrack);
  onPlayRef.current = onPlayTrack;

  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);

  const releasePlayer = useCallback(() => {
    try {
      subRef.current?.remove();
      playerRef.current?.pause();
      playerRef.current?.remove();
    } catch (e) {
      logError('releasePlayer', e);
    }
    subRef.current = null;
    playerRef.current = null;
  }, []);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch((e) =>
      logError('setAudioMode', e),
    );
    return () => releasePlayer();
  }, [releasePlayer]);

  const setIdx = (i: number) => {
    indexRef.current = i;
    setQueueIndex(i);
  };

  const startTrack = async (track: Track) => {
    const token = ++tokenRef.current;
    setError(null);
    setLoading(true);
    setCurrent(track);
    setPosition(0);
    setDuration(track.duration);
    positionRef.current = 0;
    releasePlayer();
    try {
      const url = await getAudioUrl(track.id);
      if (token !== tokenRef.current) return;
      const player = createAudioPlayer({ uri: url }, { updateInterval: 500 });
      subRef.current = player.addListener('playbackStatusUpdate', (status) => {
        if (token !== tokenRef.current) return;
        positionRef.current = status.currentTime ?? 0;
        setPosition(status.currentTime ?? 0);
        if (status.duration) setDuration(status.duration);
        setIsPlaying(!!status.playing);
        if (status.didJustFinish) endRef.current();
      });
      playerRef.current = player;
      try {
        player.setActiveForLockScreen(true, {
          title: track.title,
          artist: track.uploader,
          artworkUrl: track.thumbnail || undefined,
        });
      } catch (e) {
        logError('lockScreen', e);
      }
      player.play();
      onPlayRef.current?.(track);
    } catch (e) {
      if (token !== tokenRef.current) return;
      logError('play', e);
      setError('No se pudo cargar esta pista. Prueba otra canción.');
      setIsPlaying(false);
    } finally {
      if (token === tokenRef.current) setLoading(false);
    }
  };

  const begin = (list: Track[], index: number) => {
    queueRef.current = list;
    historyRef.current = [];
    setQueue(list);
    setIdx(index);
    return startTrack(list[index]);
  };

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.playing) p.pause();
    else p.play();
  };

  const play = async (track: Track, list?: Track[]) => {
    if (current?.id === track.id && playerRef.current) {
      toggle();
      return;
    }
    let base: Track[];
    if (list && list.some((t) => t.id === track.id)) base = list;
    else if (!list && queueRef.current.some((t) => t.id === track.id)) base = queueRef.current;
    else base = [track];
    await begin(base, base.findIndex((t) => t.id === track.id));
  };

  const playAll = async (tracks: Track[], withShuffle = false) => {
    if (tracks.length === 0) return;
    shuffleRef.current = withShuffle;
    setShuffle(withShuffle);
    const start = withShuffle ? Math.floor(Math.random() * tracks.length) : 0;
    await begin(tracks, start);
  };

  const next = (auto = false) => {
    const q = queueRef.current;
    if (q.length === 0) return;
    const i = indexRef.current;
    let ni: number;
    if (shuffleRef.current && q.length > 1) {
      historyRef.current.push(i);
      do {
        ni = Math.floor(Math.random() * q.length);
      } while (ni === i);
    } else {
      ni = i + 1;
      if (ni >= q.length) {
        if (repeatRef.current === 'all' || !auto) {
          ni = 0;
        } else {
          playerRef.current?.pause();
          void playerRef.current?.seekTo(0);
          return;
        }
      }
    }
    setIdx(ni);
    void startTrack(q[ni]);
  };

  const prev = () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    if (positionRef.current > 3) {
      void playerRef.current?.seekTo(0);
      return;
    }
    let ni: number;
    if (shuffleRef.current && historyRef.current.length > 0) {
      ni = historyRef.current.pop() as number;
    } else {
      ni = indexRef.current - 1;
      if (ni < 0) ni = repeatRef.current === 'all' ? q.length - 1 : 0;
    }
    setIdx(ni);
    void startTrack(q[ni]);
  };

  endRef.current = () => {
    if (repeatRef.current === 'one') {
      void playerRef.current?.seekTo(0);
      playerRef.current?.play();
    } else {
      next(true);
    }
  };

  const seek = async (seconds: number) => {
    await playerRef.current?.seekTo(seconds);
  };

  const stop = () => {
    tokenRef.current++;
    releasePlayer();
    queueRef.current = [];
    setQueue([]);
    setIdx(-1);
    setCurrent(null);
    setIsPlaying(false);
    setLoading(false);
    setPosition(0);
    setDuration(0);
    setNowPlayingOpen(false);
  };

  const toggleShuffle = () => {
    shuffleRef.current = !shuffleRef.current;
    setShuffle(shuffleRef.current);
  };

  const cycleRepeat = () => {
    const nextMode: RepeatMode = repeatRef.current === 'off' ? 'all' : repeatRef.current === 'all' ? 'one' : 'off';
    repeatRef.current = nextMode;
    setRepeat(nextMode);
  };

  const addToQueue = (track: Track) => {
    if (!current) {
      void play(track);
      return;
    }
    if (queueRef.current.some((t) => t.id === track.id)) return;
    const q = [...queueRef.current, track];
    queueRef.current = q;
    setQueue(q);
  };

  const playNext = (track: Track) => {
    if (!current) {
      void play(track);
      return;
    }
    if (track.id === current.id) return;
    const q = [...queueRef.current];
    let idx = indexRef.current;
    const existing = q.findIndex((t) => t.id === track.id);
    if (existing !== -1) {
      q.splice(existing, 1);
      if (existing < idx) idx -= 1;
    }
    q.splice(idx + 1, 0, track);
    queueRef.current = q;
    setQueue(q);
    setIdx(idx);
  };

  const value: PlayerState = {
    current,
    isPlaying: isPlaying && !loading,
    loading,
    position,
    duration,
    error,
    queue,
    queueIndex,
    shuffle,
    repeat,
    nowPlayingOpen,
    play,
    playAll,
    toggle,
    seek,
    next: () => next(false),
    prev,
    stop,
    toggleShuffle,
    cycleRepeat,
    addToQueue,
    playNext,
    openNowPlaying: () => setNowPlayingOpen(true),
    closeNowPlaying: () => setNowPlayingOpen(false),
  };

  return (
    <PlayerContext.Provider value={value}>
      <View style={styles.fill}>{children}</View>
      <MiniPlayer />
      <NowPlaying />
    </PlayerContext.Provider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
