import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePlayer } from '@/components/player-context';
import { useTrackMenu } from '@/components/track-menu';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { formatDuration, type Track } from '@/lib/api';
import { useLibrary } from '@/lib/library';

type RowProps = { track: Track; list: Track[]; onRemove?: () => void; removeLabel?: string };

export function TrackRow({ track, list, onRemove, removeLabel }: RowProps) {
  const { play, current, isPlaying } = usePlayer();
  const library = useLibrary();
  const menu = useTrackMenu();
  const active = current?.id === track.id;
  const liked = library.isFavorite(track.id);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={`Reproducir ${track.title}`}
        onPress={() => void play(track, list)}
        style={({ pressed }) => [styles.press, pressed && { opacity: 0.8 }]}>
        <View style={styles.artWrap}>
          {track.thumbnail ? (
            <Image source={{ uri: track.thumbnail }} style={styles.art} />
          ) : (
            <View style={[styles.art, { backgroundColor: Colors.dark.backgroundSelected }]} />
          )}
          {active ? <View style={styles.overlay} /> : null}
          {active ? <Text style={styles.overlayIcon}>{isPlaying ? '❚❚' : '▶'}</Text> : null}
        </View>
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.title, active && { color: Colors.dark.accent }]}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {track.uploader} · {formatDuration(track.duration)}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel="Me gusta"
        onPress={() => library.toggleFavorite(track)}
        style={({ pressed }) => [styles.side, pressed && { opacity: 0.7 }]}>
        <Text style={[styles.sideIcon, liked && { color: Colors.dark.accent }]}>{liked ? '♥' : '♡'}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Más opciones"
        onPress={() => menu.open(track, { onRemove, removeLabel })}
        style={({ pressed }) => [styles.side, pressed && { opacity: 0.7 }]}>
        <Text style={styles.sideIcon}>⋯</Text>
      </Pressable>
    </View>
  );
}

// Tarjeta cuadrada para carruseles horizontales.
export function TrackCard({ track, list }: { track: Track; list: Track[] }) {
  const { play, current } = usePlayer();
  const active = current?.id === track.id;
  return (
    <Pressable onPress={() => void play(track, list)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
      {track.thumbnail ? (
        <Image source={{ uri: track.thumbnail }} style={styles.cardArt} />
      ) : (
        <View style={[styles.cardArt, { backgroundColor: Colors.dark.backgroundSelected }]} />
      )}
      <Text numberOfLines={2} style={[styles.cardTitle, active && { color: Colors.dark.accent }]}>
        {track.title}
      </Text>
      <Text numberOfLines={1} style={styles.subtitle}>
        {track.uploader}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, overflow: 'hidden' },
  press: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: TouchTarget, paddingVertical: 6 },
  artWrap: { width: 52, height: 52, borderRadius: 8, overflow: 'hidden', marginRight: Spacing.two },
  art: { width: 52, height: 52 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,14,42,0.55)' },
  overlayIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, textAlign: 'center', lineHeight: 52, color: Colors.dark.heading, fontSize: 14 },
  info: { flex: 1, minWidth: 0 },
  title: { color: Colors.dark.text, fontSize: 15, fontWeight: '600' },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 12, marginTop: 2 },
  side: { width: 40, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  sideIcon: { color: Colors.dark.textSecondary, fontSize: 22 },
  card: { width: 140, marginRight: Spacing.three },
  cardArt: { width: 140, height: 140, borderRadius: Radius.md, marginBottom: 6 },
  cardTitle: { color: Colors.dark.text, fontSize: 13, fontWeight: '700' },
});
