import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { TrackList } from '@/components/track-list';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { searchTracks, type Track } from '@/lib/api';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    searchTracks(q)
      .then(setTracks)
      .catch(() => setError('La búsqueda falló. Prueba de nuevo en un momento.'))
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Buscar canciones o artistas"
          placeholderTextColor={Colors.dark.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
          accessibilityLabel="Buscar canciones"
        />
        <Pressable
          accessibilityLabel="Buscar"
          onPress={runSearch}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
          <Text style={styles.buttonText}>Buscar</Text>
        </Pressable>
      </View>
      {searched ? (
        <TrackList
          tracks={tracks}
          loading={loading}
          error={error}
          onRetry={runSearch}
          emptyText="Sin resultados para esa búsqueda."
        />
      ) : (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Busca cualquier canción y tócala para reproducirla al instante. Guarda tus favoritas con ★.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background, padding: Spacing.three, paddingBottom: 0 },
  searchRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  input: {
    flex: 1,
    minHeight: TouchTarget,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Radius.md,
    color: Colors.dark.text,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  button: {
    minHeight: TouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.accent,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  hint: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  hintText: { color: Colors.dark.textSecondary, fontSize: 15, lineHeight: 22 },
});
