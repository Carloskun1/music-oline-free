import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayer } from '@/components/player-context';
import { Colors, MINI_PLAYER, Radius, Spacing, TAB_BAR } from '@/constants/theme';
import { useLibrary } from '@/lib/library';

export function MiniPlayer() {
  const { current, isPlaying, loading, toggle, next, position, duration, error, openNowPlaying, nowPlayingOpen } =
    usePlayer();
  const library = useLibrary();
  const insets = useSafeAreaInsets();
  if (!current || nowPlayingOpen) return null;
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const liked = library.isFavorite(current.id);

  return (
    <View style={[styles.mini, { bottom: TAB_BAR + insets.bottom }]}>
      <Pressable onPress={openNowPlaying} style={styles.body} accessibilityLabel="Abrir reproductor">
        {current.thumbnail ? (
          <Image source={{ uri: current.thumbnail }} style={styles.art} />
        ) : (
          <View style={[styles.art, { backgroundColor: Colors.dark.backgroundSelected }]} />
        )}
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title}>
            {current.title}
          </Text>
          <Text numberOfLines={1} style={error ? styles.error : styles.artist}>
            {error ?? current.uploader}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={() => library.toggleFavorite(current)} style={styles.btn} accessibilityLabel="Me gusta">
        <Text style={[styles.icon, liked && { color: Colors.dark.accent }]}>{liked ? '♥' : '♡'}</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator color={Colors.dark.accent} style={styles.btn} />
      ) : (
        <Pressable onPress={toggle} style={styles.btn} accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}>
          <Text style={styles.iconBig}>{isPlaying ? '❚❚' : '▶'}</Text>
        </Pressable>
      )}
      <Pressable onPress={next} style={styles.btn} accessibilityLabel="Siguiente">
        <Text style={styles.icon}>»</Text>
      </Pressable>
      <View style={styles.progressBar}>
        <View style={{ flex: progress, backgroundColor: Colors.dark.accent }} />
        <View style={{ flex: 1 - progress, backgroundColor: Colors.dark.border }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mini: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    height: MINI_PLAYER - 8,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.two, gap: Spacing.two },
  art: { width: 42, height: 42, borderRadius: 8 },
  info: { flex: 1, minWidth: 0 },
  title: { color: Colors.dark.text, fontSize: 14, fontWeight: '700' },
  artist: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 1 },
  error: { color: Colors.dark.danger, fontSize: 11, marginTop: 1 },
  btn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { color: Colors.dark.text, fontSize: 22 },
  iconBig: { color: Colors.dark.heading, fontSize: 20, fontWeight: '800' },
  progressBar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, flexDirection: 'row' },
});
