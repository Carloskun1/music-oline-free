import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useListBottomPad, usePlayer } from '@/components/player-context';
import { TrackCard, TrackRow } from '@/components/track-row';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getTrending, type Track } from '@/lib/api';
import { useLibrary } from '@/lib/library';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const pad = useListBottomPad(24);
  const library = useLibrary();
  const { playAll } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getTrending()
      .then(setTracks)
      .catch(() => setError('No se pudo cargar la música. Revisa tu conexión.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shortcuts: { key: string; title: string; list: Track[] }[] = [
    { key: 'likes', title: 'Canciones que te gustan', list: library.favorites },
    { key: 'recent', title: 'Escuchado recientemente', list: library.history },
    ...Object.entries(library.playlists).map(([name, list]) => ({ key: `pl-${name}`, title: name, list })),
  ]
    .filter((s) => s.list.length > 0)
    .slice(0, 6);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: pad }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Colors.dark.accent} />}>
      <Text style={styles.greeting}>{greeting()}</Text>

      {shortcuts.length > 0 ? (
        <View style={styles.grid}>
          {shortcuts.map((s) => (
            <Pressable key={s.key} onPress={() => void playAll(s.list, false)} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}>
              {s.list[0]?.thumbnail ? (
                <Image source={{ uri: s.list[0].thumbnail }} style={styles.tileArt} />
              ) : (
                <View style={[styles.tileArt, { backgroundColor: Colors.dark.backgroundSelected }]} />
              )}
              <Text numberOfLines={2} style={styles.tileText}>
                {s.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading ? <ActivityIndicator color={Colors.dark.accent} style={{ marginTop: Spacing.five }} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {tracks.length > 0 ? (
        <>
          <Text style={styles.section}>Tendencias ahora</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={tracks.slice(0, 12)}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ paddingHorizontal: Spacing.three }}
            renderItem={({ item }) => <TrackCard track={item} list={tracks} />}
          />
        </>
      ) : null}

      {library.history.length > 0 ? (
        <>
          <Text style={styles.section}>Escuchado recientemente</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={library.history.slice(0, 12)}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ paddingHorizontal: Spacing.three }}
            renderItem={({ item }) => <TrackCard track={item} list={library.history} />}
          />
        </>
      ) : null}

      {tracks.length > 12 ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={[styles.section, { marginTop: 0, paddingHorizontal: 0 }]}>Para ti</Text>
            <Pressable onPress={() => void playAll(tracks, true)} style={styles.shuffleBtn}>
              <Text style={styles.shuffleText}>⇄ Aleatorio</Text>
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: Spacing.three }}>
            {tracks.slice(12).map((t) => (
              <TrackRow key={t.id} track={t} list={tracks} />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background },
  greeting: { color: Colors.dark.heading, fontSize: 28, fontWeight: '800', paddingHorizontal: Spacing.three, marginBottom: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.three, gap: Spacing.two },
  tile: { width: '48.5%', flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.backgroundElement, borderRadius: 8, overflow: 'hidden' },
  tileArt: { width: 52, height: 52 },
  tileText: { flex: 1, color: Colors.dark.text, fontSize: 13, fontWeight: '700', paddingHorizontal: Spacing.two },
  section: { color: Colors.dark.text, fontSize: 20, fontWeight: '800', paddingHorizontal: Spacing.three, marginTop: Spacing.four, marginBottom: Spacing.two },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, marginTop: Spacing.four, marginBottom: Spacing.two },
  shuffleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.dark.accent },
  shuffleText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  errorBox: { margin: Spacing.three, padding: Spacing.three, backgroundColor: Colors.dark.backgroundElement, borderRadius: Radius.lg, gap: Spacing.two },
  errorText: { color: Colors.dark.danger },
  retry: { alignSelf: 'flex-start', paddingHorizontal: Spacing.three, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.dark.backgroundSelected },
  retryText: { color: Colors.dark.heading, fontWeight: '700' },
});
