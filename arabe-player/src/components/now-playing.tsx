import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { usePlayer } from '@/components/player-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/api';
import { useLibrary } from '@/lib/library';

// Posición del video de YouTube cuando se ve en la pantalla de reproducción.
export function ytBoxRect(screenWidth: number, topInset: number) {
  const art = Math.min(screenWidth - 48, 360);
  return { width: art, height: Math.max(200, Math.round(art * 0.5625)), left: (screenWidth - art) / 2, top: topInset + 8 + 44 + 16 };
}

export function NowPlaying() {
  const p = usePlayer();
  const library = useLibrary();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [barW, setBarW] = useState(1);
  const [drag, setDrag] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [site, setSite] = useState(false);

  const open = p.nowPlayingOpen;
  const close = p.closeNowPlaying;
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [open, close]);

  const track = p.current;
  const trackId = track?.id;
  const blocked = !!p.error && p.error.includes('fuera de YouTube');

  // Canción nueva: cerrar la vista del sitio. Canción bloqueada: abrirla sola dentro de la app.
  useEffect(() => {
    setSite(false);
  }, [trackId]);
  useEffect(() => {
    if (open && blocked && track?.source === 'youtube') setSite(true);
  }, [open, blocked, track?.source]);

  if (!track || !open) return null;
  const isYt = track.source === 'youtube';
  const slot = ytBoxRect(width, 0);
  const dur = p.duration > 0 ? p.duration : track.duration;
  const shown = drag ?? p.position;
  const frac = dur > 0 ? Math.min(Math.max(shown / dur, 0), 1) : 0;
  const art = Math.min(width - 48, 360);
  const liked = library.isFavorite(track.id);

  const setFromX = (x: number) => {
    const v = Math.min(Math.max(x / barW, 0), 1) * dur;
    dragRef.current = v;
    setDrag(v);
  };
  const upcoming = p.queue.slice(p.queueIndex + 1);

  return (
    <>
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Pressable onPress={p.closeNowPlaying} style={styles.headerBtn} accessibilityLabel="Cerrar">
            <Text style={styles.headerIcon}>⌄</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{showQueue ? 'En cola' : 'Reproduciendo'}</Text>
          <Pressable onPress={p.stop} style={styles.headerBtn} accessibilityLabel="Detener">
            <Text style={[styles.headerIcon, { fontSize: 18 }]}>✕</Text>
          </Pressable>
        </View>

        {showQueue ? (
          <FlatList
            style={{ flex: 1 }}
            data={upcoming}
            keyExtractor={(t, i) => `${t.id}-${i}`}
            ListEmptyComponent={<Text style={styles.empty}>No hay más canciones en la cola.</Text>}
            renderItem={({ item }) => (
              <Pressable onPress={() => void p.play(item, p.queue)} style={styles.qRow}>
                {item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={styles.qArt} />
                ) : (
                  <View style={[styles.qArt, { backgroundColor: Colors.dark.backgroundSelected }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.qTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.qArtist}>
                    {item.uploader}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        ) : isYt ? (
          <View style={[styles.artWrap, { justifyContent: 'flex-start' }]}>
            <View style={{ width: slot.width, height: slot.height }} />
            <Text style={styles.ytHint}>Reproductor oficial de YouTube. La música se pausa si sales de la app.</Text>
          </View>
        ) : (
          <View style={styles.artWrap}>
            {track.thumbnail ? (
              <Image source={{ uri: track.thumbnail }} style={{ width: art, height: art, borderRadius: Radius.lg }} />
            ) : (
              <View
                style={{ width: art, height: art, borderRadius: Radius.lg, backgroundColor: Colors.dark.backgroundSelected }}
              />
            )}
          </View>
        )}

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.title}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {track.uploader}
            </Text>
          </View>
          <Pressable onPress={() => library.toggleFavorite(track)} style={styles.headerBtn} accessibilityLabel="Me gusta">
            <Text style={[styles.heart, liked && { color: Colors.dark.accent }]}>{liked ? '♥' : '♡'}</Text>
          </Pressable>
        </View>
        {p.error ? <Text style={styles.error}>{p.error}</Text> : null}
        {p.error && isYt ? (
          <View style={styles.errActions}>
            <Pressable onPress={() => setSite(true)} style={styles.errBtn}>
              <Text style={styles.errBtnText}>Ver en YouTube aquí</Text>
            </Pressable>
            <Pressable
              onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${track.id}`)}
              style={[styles.errBtn, { backgroundColor: Colors.dark.backgroundSelected }]}>
              <Text style={styles.errBtnText}>Abrir app de YouTube ↗</Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={styles.seekArea}
          onLayout={(e) => setBarW(Math.max(e.nativeEvent.layout.width, 1))}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => setFromX(e.nativeEvent.locationX)}
          onResponderMove={(e) => setFromX(e.nativeEvent.locationX)}
          onResponderRelease={() => {
            if (dragRef.current !== null) void p.seek(dragRef.current);
            dragRef.current = null;
            setDrag(null);
          }}
          onResponderTerminate={() => {
            dragRef.current = null;
            setDrag(null);
          }}>
          <View style={styles.seekTrack} pointerEvents="none">
            <View style={{ flex: frac, backgroundColor: Colors.dark.accent }} />
            <View style={{ flex: 1 - frac }} />
          </View>
          <View pointerEvents="none" style={[styles.knob, { left: `${frac * 100}%` }]} />
        </View>
        <View style={styles.times}>
          <Text style={styles.time}>{formatDuration(shown)}</Text>
          <Text style={styles.time}>{formatDuration(dur)}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={p.toggleShuffle} style={styles.ctrl} accessibilityLabel="Aleatorio">
            <Text style={[styles.ctrlIcon, p.shuffle && { color: Colors.dark.accent }]}>⇄</Text>
          </Pressable>
          <Pressable onPress={p.prev} style={styles.ctrl} accessibilityLabel="Anterior">
            <Text style={styles.ctrlIconBig}>«</Text>
          </Pressable>
          <Pressable onPress={p.toggle} style={styles.playBtn} accessibilityLabel={p.isPlaying ? 'Pausar' : 'Reproducir'}>
            {p.loading ? (
              <ActivityIndicator color="#0A0E2A" />
            ) : (
              <Text style={styles.playIcon}>{p.isPlaying ? '❚❚' : '▶'}</Text>
            )}
          </Pressable>
          <Pressable onPress={p.next} style={styles.ctrl} accessibilityLabel="Siguiente">
            <Text style={styles.ctrlIconBig}>»</Text>
          </Pressable>
          <Pressable onPress={p.cycleRepeat} style={styles.ctrl} accessibilityLabel="Repetir">
            <Text style={[styles.ctrlIcon, p.repeat !== 'off' && { color: Colors.dark.accent }]}>
              {p.repeat === 'one' ? '↻1' : '↻'}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setShowQueue((v) => !v)} style={styles.queueBtn}>
          <Text style={styles.queueText}>{showQueue ? 'Ver portada' : `Cola (${upcoming.length})`}</Text>
        </Pressable>
      </View>
      {site ? (
        <View style={[styles.site, { paddingTop: insets.top }]}>
          <View style={styles.siteHeader}>
            <Text numberOfLines={1} style={styles.siteTitle}>
              {track.title}
            </Text>
            <Pressable
              onPress={() => {
                setSite(false);
                p.next();
              }}
              style={styles.headerBtn}
              accessibilityLabel="Siguiente">
              <Text style={styles.headerIcon}>»</Text>
            </Pressable>
            <Pressable onPress={() => setSite(false)} style={styles.headerBtn} accessibilityLabel="Cerrar YouTube">
              <Text style={[styles.headerIcon, { fontSize: 20 }]}>✕</Text>
            </Pressable>
          </View>
          <WebView
            source={{ uri: `https://m.youtube.com/watch?v=${track.id}` }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            injectedJavaScript={`(function(){var n=0;var t=setInterval(function(){var v=document.querySelector('video');if(v){try{v.play();}catch(e){}}if(++n>20)clearInterval(t);},500);})();true;`}
            style={{ flex: 1, backgroundColor: '#000' }}
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFillObject, zIndex: 50, backgroundColor: Colors.dark.background, paddingHorizontal: 24 },
  ytHint: { color: Colors.dark.textSecondary, fontSize: 11, textAlign: 'center', marginTop: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { color: Colors.dark.text, fontSize: 28 },
  headerTitle: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  artWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.three },
  title: { color: Colors.dark.text, fontSize: 22, fontWeight: '800' },
  artist: { color: Colors.dark.textSecondary, fontSize: 15, marginTop: 2 },
  heart: { color: Colors.dark.text, fontSize: 28 },
  error: { color: Colors.dark.danger, fontSize: 12, marginTop: 4 },
  errActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  errBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.dark.accent },
  errBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  site: { ...StyleSheet.absoluteFillObject, zIndex: 120, backgroundColor: '#000' },
  siteHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, backgroundColor: Colors.dark.background },
  siteTitle: { flex: 1, color: Colors.dark.text, fontWeight: '700' },
  seekArea: { height: 32, justifyContent: 'center', marginTop: Spacing.three },
  seekTrack: { height: 4, borderRadius: 2, backgroundColor: Colors.dark.border, flexDirection: 'row', overflow: 'hidden' },
  knob: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', marginLeft: -7, top: 9 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: Colors.dark.textSecondary, fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.three },
  ctrl: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  ctrlIcon: { color: Colors.dark.text, fontSize: 24, fontWeight: '700' },
  ctrlIconBig: { color: Colors.dark.text, fontSize: 40, fontWeight: '700', marginTop: -6 },
  playBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#0A0E2A', fontSize: 24, fontWeight: '800' },
  queueBtn: { alignSelf: 'center', paddingVertical: 12, marginTop: Spacing.two },
  queueText: { color: Colors.dark.heading, fontWeight: '700', fontSize: 14 },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: Spacing.four },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 8 },
  qArt: { width: 44, height: 44, borderRadius: 8 },
  qTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: '600' },
  qArtist: { color: Colors.dark.textSecondary, fontSize: 12 },
});
