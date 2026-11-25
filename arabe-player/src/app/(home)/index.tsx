import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { TrackList } from '@/components/track-list';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { getTrending, type Track } from '@/lib/api';

export default function HomeScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    getTrending()
      .then(setTracks)
      .catch(() => setError('No se pudo cargar las tendencias. Revisa tu conexión.'))
      .finally(() => {
        setLoading(false);
        setLoadedOnce(true);
      });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>Arabe Player</Text>
      <Text style={styles.heading}>Tu música, en modo escenario</Text>
      {!loadedOnce ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Descubre lo que suena ahora. Tendencias de música listas para reproducir.
          </Text>
          <Text style={styles.emptyAction} onPress={load} accessibilityRole="button">
            Cargar tendencias
          </Text>
        </View>
      ) : (
        <TrackList tracks={tracks} loading={loading} error={error} onRetry={load} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background, padding: Spacing.three, paddingBottom: 0 },
  eyebrow: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heading: {
    color: Colors.dark.heading,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  emptyState: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  emptyText: { color: Colors.dark.textSecondary, fontSize: 15, lineHeight: 22 },
  emptyAction: {
    color: Colors.dark.heading,
    fontWeight: '700',
    fontSize: 17,
    minHeight: TouchTarget,
    textAlignVertical: 'center',
  },
});
