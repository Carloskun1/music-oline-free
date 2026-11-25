import { useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useListBottomPad, usePlayer } from '@/components/player-context';
import { TrackRow } from '@/components/track-row';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import type { Track } from '@/lib/api';
import { useLibrary } from '@/lib/library';

type Tab = 'playlists' | 'favorites' | 'history';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const pad = useListBottomPad(24);
  const library = useLibrary();
  const { playAll } = usePlayer();
  const [tab, setTab] = useState<Tab>('playlists');
  const [name, setName] = useState('');
  const [openPlaylist, setOpenPlaylist] = useState<string | null>(null);

  const top = { paddingTop: insets.top + 12 };

  const createPlaylist = () => {
    const n = name.trim();
    if (n) {
      library.createPlaylist(n);
      setName('');
    }
  };

  const PlayButtons = ({ list }: { list: Track[] }) =>
    list.length > 0 ? (
      <View style={styles.actions}>
        <Pressable onPress={() => void playAll(list, false)} style={[styles.action, { backgroundColor: Colors.dark.accent }]}>
          <Text style={styles.actionText}>▶ Reproducir</Text>
        </Pressable>
        <Pressable onPress={() => void playAll(list, true)} style={[styles.action, { backgroundColor: Colors.dark.backgroundSelected }]}>
          <Text style={styles.actionText}>⇄ Aleatorio</Text>
        </Pressable>
      </View>
    ) : null;

  // Detalle de una lista
  if (openPlaylist) {
    const tracks: Track[] = library.playlists[openPlaylist] ?? [];
    return (
      <FlatList
        style={styles.screen}
        contentContainerStyle={[top, { paddingHorizontal: Spacing.three, paddingBottom: pad }]}
        data={tracks}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View>
            <Pressable onPress={() => setOpenPlaylist(null)} style={styles.back}>
              <Text style={styles.backText}>‹ Tu biblioteca</Text>
            </Pressable>
            <Text style={styles.heading}>{openPlaylist}</Text>
            <Text style={styles.count}>{tracks.length} canciones</Text>
            <PlayButtons list={tracks} />
            <Pressable
              onPress={() =>
                Alert.alert('Eliminar lista', `¿Eliminar "${openPlaylist}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                      library.deletePlaylist(openPlaylist);
                      setOpenPlaylist(null);
                    },
                  },
                ])
              }>
              <Text style={styles.delete}>Eliminar lista</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Lista vacía. Toca ⋯ en una canción y elige "Añadir a una lista".</Text>}
        renderItem={({ item }) => (
          <TrackRow track={item} list={tracks} onRemove={() => library.removeFromPlaylist(openPlaylist, item.id)} />
        )}
      />
    );
  }

  const header = (
    <View>
      <Text style={styles.heading}>Tu biblioteca</Text>
      <View style={styles.tabs}>
        {(
          [
            ['playlists', 'Listas'],
            ['favorites', 'Me gusta'],
            ['history', 'Recientes'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (tab === 'playlists') {
    const entries: [string, Track[]][] = Object.entries(library.playlists);
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[top, { paddingHorizontal: Spacing.three, paddingBottom: pad }]} keyboardShouldPersistTaps="handled">
        {header}
        <View style={styles.newRow}>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la nueva lista"
            placeholderTextColor={Colors.dark.textSecondary}
            value={name}
            onChangeText={setName}
            onSubmitEditing={createPlaylist}
          />
          <Pressable onPress={createPlaylist} style={styles.createBtn}>
            <Text style={styles.actionText}>Crear</Text>
          </Pressable>
        </View>
        {entries.length === 0 ? <Text style={styles.empty}>Crea tu primera lista y añade canciones desde el menú ⋯.</Text> : null}
        {entries.map(([n, list]) => (
          <Pressable key={n} onPress={() => setOpenPlaylist(n)} style={({ pressed }) => [styles.plItem, pressed && { opacity: 0.8 }]}>
            {list[0]?.thumbnail ? (
              <Image source={{ uri: list[0].thumbnail }} style={styles.plArt} />
            ) : (
              <View style={[styles.plArt, { backgroundColor: Colors.dark.backgroundSelected }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.plName}>
                {n}
              </Text>
              <Text style={styles.count}>Lista · {list.length} canciones</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  const tracks = tab === 'favorites' ? library.favorites : library.history;
  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[top, { paddingHorizontal: Spacing.three, paddingBottom: pad }]}
      data={tracks}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={
        <View>
          {header}
          <PlayButtons list={tracks} />
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {tab === 'favorites' ? 'Toca ♡ en cualquier canción para guardarla aquí.' : 'Lo que reproduzcas aparecerá aquí.'}
        </Text>
      }
      renderItem={({ item }) => <TrackRow track={item} list={tracks} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background },
  heading: { color: Colors.dark.heading, fontSize: 28, fontWeight: '800', marginBottom: Spacing.three },
  count: { color: Colors.dark.textSecondary, fontSize: 13, marginBottom: Spacing.two },
  back: { minHeight: TouchTarget, justifyContent: 'center' },
  backText: { color: Colors.dark.accent, fontSize: 16, fontWeight: '700' },
  delete: { color: Colors.dark.danger, fontWeight: '700', marginBottom: Spacing.three },
  tabs: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  tab: { paddingHorizontal: Spacing.three, height: 38, justifyContent: 'center', borderRadius: 19, backgroundColor: Colors.dark.backgroundElement },
  tabActive: { backgroundColor: Colors.dark.accent },
  tabText: { color: Colors.dark.textSecondary, fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  action: { paddingHorizontal: Spacing.three, height: 42, borderRadius: 21, justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  newRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  input: { flex: 1, minHeight: 44, backgroundColor: Colors.dark.backgroundElement, borderRadius: Radius.md, color: Colors.dark.text, paddingHorizontal: Spacing.three, borderWidth: 1, borderColor: Colors.dark.border },
  createBtn: { minHeight: 44, paddingHorizontal: Spacing.four, borderRadius: Radius.md, backgroundColor: Colors.dark.accent, justifyContent: 'center' },
  empty: { color: Colors.dark.textSecondary, fontSize: 15, lineHeight: 22, marginTop: Spacing.two },
  plItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 8 },
  plArt: { width: 60, height: 60, borderRadius: 8 },
  plName: { color: Colors.dark.text, fontSize: 16, fontWeight: '700' },
});
