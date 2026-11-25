import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrackList } from '@/components/track-list';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { searchTracks, type Track } from '@/lib/api';

const GENRES = ['Pop', 'Electrónica', 'Hip hop', 'Lo-fi', 'Rock', 'Chill', 'Reggaeton', 'Jazz', 'House', 'Acústico'];
const COLORS = ['#7B3FE4', '#1E6FD9', '#B03FA8', '#2A9D8F', '#D1495B', '#3D5A98', '#E07A1F', '#5E548E', '#0E7C86', '#6A994E'];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) {
      setTracks([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      searchTracks(q)
        .then((r) => {
          if (!cancelled) {
            setTracks(r);
            setError(null);
          }
        })
        .catch(() => !cancelled && setError('La búsqueda falló. Prueba de nuevo en un momento.'))
        .finally(() => !cancelled && setLoading(false));
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.heading}>Buscar</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="¿Qué quieres escuchar?"
          placeholderTextColor={Colors.dark.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} style={styles.clear} accessibilityLabel="Borrar">
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {q.length < 2 ? (
        <ScrollView>
          <Text style={styles.sub}>Explorar géneros</Text>
          <View style={styles.genres}>
            {GENRES.map((g, i) => (
              <Pressable key={g} onPress={() => setQuery(g)} style={[styles.genre, { backgroundColor: COLORS[i % COLORS.length] }]}>
                <Text style={styles.genreText}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <TrackList tracks={tracks} loading={loading} error={error} emptyText="Sin resultados para esa búsqueda." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background, paddingHorizontal: Spacing.three },
  heading: { color: Colors.dark.heading, fontSize: 28, fontWeight: '800', marginBottom: Spacing.three },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: Radius.md, marginBottom: Spacing.three },
  input: { flex: 1, minHeight: TouchTarget + 4, color: '#0A0E2A', paddingHorizontal: Spacing.three, fontSize: 16, fontWeight: '600' },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: '#0A0E2A', fontSize: 16 },
  sub: { color: Colors.dark.text, fontSize: 18, fontWeight: '800', marginBottom: Spacing.two },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  genre: { width: '48.5%', height: 84, borderRadius: Radius.md, padding: Spacing.three, justifyContent: 'flex-start' },
  genreText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
