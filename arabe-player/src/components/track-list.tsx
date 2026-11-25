import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useListBottomPad } from '@/components/player-context';
import { TrackRow } from '@/components/track-row';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import type { Track } from '@/lib/api';

type Props = {
  tracks: Track[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyText?: string;
  onRemove?: (track: Track) => void;
};

export function TrackList({ tracks, loading, error, onRetry, emptyText, onRemove }: Props) {
  const pad = useListBottomPad();
  if (loading) return <ActivityIndicator color={Colors.dark.accent} style={styles.center} />;
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if (tracks.length === 0) return <Text style={[styles.center, styles.empty]}>{emptyText ?? 'Nada por aquí todavía.'}</Text>;

  return (
    <FlatList
      data={tracks}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ paddingBottom: pad }}
      renderItem={({ item }) => (
        <TrackRow track={item} list={tracks} onRemove={onRemove ? () => onRemove(item) : undefined} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center' },
  errorText: { color: Colors.dark.danger, textAlign: 'center', marginBottom: Spacing.three },
  retry: { minHeight: TouchTarget, paddingHorizontal: Spacing.four, justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.dark.backgroundSelected },
  retryText: { color: Colors.dark.heading, fontWeight: '600' },
});
