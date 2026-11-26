import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { MiniPlayer } from '@/components/mini-player';
import { NowPlaying, ytBoxRect } from '@/components/now-playing';
import { YoutubePlayer, type YoutubeIframeRef } from '@/components/yt-player';
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
  const ytRef = useRef<YoutubeIframeRef | null>(null);
  const engineRef = useRef<'audio' | 'yt' | null>(null);
  const loadingRef = useRef(false);
  const skipRef = useRef(0);
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
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
  const [ytId, setYtId] = useState<string | null>(null);
  const [ytPlay, setYtPlay] = useState(false);
  const ytFailRef = useRef(0);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  loadingRef.current = loading;

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

  useEffect(() => {
    if (!ytId) return;
    const timer = setInterval(async () => {
      try {
        const t = await ytRef.current?.getCurrentTime();
        if (typeof t === 'number') {
          positionRef.current = t;
          setPosition(t);
        }
      } catch {}
    }, 500);
    return () => clearInterval(timer);
  }, [ytId]);

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
    if (track.source === 'youtube') {
      engineRef.current = 'yt';
      setYtId(track.id);
      setYtPlay(true);
      onPlayRef.current?.(track);
      return; // el reproductor de YouTube avisa cuando empieza (onChangeState)
    }
    engineRef.current = 'audio';
    setYtId(null);
    setYtPlay(false);
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
    if (engineRef.current === 'yt') {
      setIsPlaying(!ytPlay);
      setYtPlay(!ytPlay);
      return;
    }
    const p = playerRef.current;
    if (!p) return;
    if (p.playing) p.pause();
    else p.play();
  };

  const play = async (track: Track, list?: Track[]) => {
    if (current?.id === track.id && (playerRef.current || engineRef.current === 'yt')) {
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

  const seekEngine = async (seconds: number) => {
    if (engineRef.current === 'yt') ytRef.current?.seekTo(seconds, true);
    else await playerRef.current?.seekTo(seconds);
  };

  const pauseAndRewind = () => {
    if (engineRef.current === 'yt') {
      setYtPlay(false);
      setIsPlaying(false);
      ytRef.current?.seekTo(0, true);
    } else {
      playerRef.current?.pause();
      void playerRef.current?.seekTo(0);
    }
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
          pauseAndRewind();
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
      void seekEngine(0);
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
      void seekEngine(0);
      if (engineRef.current === 'yt') setYtPlay(true);
      else playerRef.current?.play();
    } else {
      next(true);
    }
  };

  const seek = async (seconds: number) => {
    await seekEngine(seconds);
  };

  const stop = () => {
    tokenRef.current++;
    releasePlayer();
    engineRef.current = null;
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    setYtId(null);
    setYtPlay(false);
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

  const onYtState = (state: string) => {
    if (state === 'playing') {
      ytFailRef.current = 0;
      skipRef.current = 0;
      setError(null);
      setIsPlaying(true);
      setYtPlay(true);
      setLoading(false);
      ytRef.current
        ?.getDuration()
        .then((d) => d > 0 && setDuration(d))
        .catch(() => {});
    } else if (state === 'paused') {
      setIsPlaying(false);
      if (!loadingRef.current) setYtPlay(false);
    } else if (state === 'ended') {
      setIsPlaying(false);
      endRef.current();
    }
  };

  const onYtError = (e: string) => {
    setLoading(false);
    setIsPlaying(false);
    // 100/101/150/152/153: el dueño del video no permite reproducirlo fuera de YouTube.
    const blocked = ['100', '101', '150', '152', '153'].includes(e);
    logError('youtube (reproductor)', new Error(e));
    ytFailRef.current += 1;
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    const q = queueRef.current;
    if (q.length > 1 && ytFailRef.current < q.length) {
      setError(
        blocked
          ? `"${current?.title ?? 'Este video'}" no permite reproducirse fuera de YouTube. Saltando a la siguiente…`
          : `"${current?.title ?? 'Este video'}" no está disponible. Saltando a la siguiente…`,
      );
      skipTimerRef.current = setTimeout(() => {
        skipTimerRef.current = null;
        next(true);
      }, 1500);
    } else {
      setError(
        blocked
          ? 'Este video no permite reproducirse fuera de YouTube. Prueba otra canción.'
          : 'Este video no se puede reproducir aquí. Prueba otra canción.',
      );
    }
  };

  const box = ytBoxRect(screenW, insets.top);
  const ytStyle = nowPlayingOpen
    ? { position: 'absolute' as const, top: box.top, left: box.left, width: box.width, height: box.height, zIndex: 100 }
    : { position: 'absolute' as const, bottom: 0, left: 0, width: 200, height: 200, opacity: 0.01, zIndex: -1 };

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
      {ytId ? (
        <View style={ytStyle} pointerEvents={nowPlayingOpen ? 'auto' : 'none'}>
          <YoutubePlayer
            ref={ytRef}
            width={nowPlayingOpen ? box.width : 200}
            height={nowPlayingOpen ? box.height : 200}
            videoId={ytId}
            play={ytPlay}
            onChangeState={onYtState}
            onError={onYtError}
          />
        </View>
      ) : null}
    </PlayerContext.Provider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
