import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { formatDuration, type Track } from '@/lib/api';
import { useLibrary } from '@/lib/library';
import { usePlayer } from '@/components/player-provider';

type Props = {
  tracks: Track[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyText?: string;
  onRemove?: (track: Track) => void;
};

export function TrackList({ tracks, loading, error, onRetry, emptyText, onRemove }: Props) {
  const { play, current, isPlaying } = usePlayer();
  const library = useLibrary();

  if (loading) {
    return <ActivityIndicator color={Colors.dark.accent} style={styles.center} />;
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry ? (
          <Pressable accessibilityLabel="Reintentar" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && { opacity: 0.7 }]}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if (tracks.length === 0) {
    return <Text style={[styles.center, styles.empty]}>{emptyText ?? 'Nada por aquí todavía.'}</Text>;
  }

  return (
    <FlatList
      data={tracks}
      keyExtractor={(t) => t.id}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        const active = current?.id === item.id;
        return (
          <View style={[styles.row, active && styles.rowActive]}>
            <Pressable
              accessibilityLabel={`Reproducir ${item.title}`}
              onPress={() => void play(item)}
              style={({ pressed }) => [styles.rowPress, pressed && { opacity: 0.8 }]}>
              {item.thumbnail ? (
                <View style={styles.artWrap}>
                  {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={styles.art} /> : null}
                  {active ? <View style={styles.artOverlay} /> : null}
                  {active ? (
                    <Text style={styles.artOverlayIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={[styles.artWrap, styles.artPlaceholder]} />
              )}
              <View style={styles.info}>
                <Text numberOfLines={1} style={[styles.title, active && { color: Colors.dark.accent }]}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={styles.subtitle}>
                  {item.uploader} · {formatDuration(item.duration)}
                </Text>
              </View>
            </Pressable>
            {onRemove ? (
              <Pressable
                accessibilityLabel={`Quitar ${item.title}`}
                onPress={() => onRemove(item)}
                style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.7 }]}>
                <Text style={[styles.sideIcon, { color: Colors.dark.danger }]}>✕</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityLabel={
                  library.isFavorite(item.id) ? `Quitar de favoritos ${item.title}` : `Añadir a favoritos ${item.title}`
                }
                onPress={() => library.toggleFavorite(item)}
                style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.7 }]}>
                <Text style={[styles.sideIcon, library.isFavorite(item.id) && { color: Colors.dark.accent }]}>
                  {library.isFavorite(item.id) ? '★' : '☆'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  empty: { color: Colors.dark.textSecondary, textAlign: 'center' },
  errorText: { color: Colors.dark.danger, textAlign: 'center', marginBottom: Spacing.three },
  retry: {
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.backgroundSelected,
  },
  retryText: { color: Colors.dark.heading, fontWeight: '600' },
  separator: { height: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  rowActive: { borderColor: Colors.dark.accent, borderWidth: 1 },
  rowPress: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: TouchTarget, padding: Spacing.two },
  artWrap: { width: 56, height: 56, borderRadius: Radius.md, overflow: 'hidden', marginRight: Spacing.two },
  art: { width: 56, height: 56 },
  artPlaceholder: { backgroundColor: Colors.dark.backgroundSelected },
  artOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,14,42,0.55)' },
  artOverlayIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 56,
    color: Colors.dark.heading,
    fontSize: 16,
  },
  info: { flex: 1, minWidth: 0 },
  title: { color: Colors.dark.text, fontSize: 15, fontWeight: '600' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  sideBtn: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  sideIcon: { color: Colors.dark.textSecondary, fontSize: 20 },
});
