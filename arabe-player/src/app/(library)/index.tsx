import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { TrackList } from '@/components/track-list';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useLibrary } from '@/lib/library';
import type { Track } from '@/lib/api';

type Tab = 'favorites' | 'history' | 'playlists';

export default function LibraryScreen() {
  const library = useLibrary();
  const [tab, setTab] = useState<Tab>('favorites');
  const [playlistName, setPlaylistName] = useState('');
  const [openPlaylist, setOpenPlaylist] = useState<string | null>(null);

  const createPlaylist = () => {
    const name = playlistName.trim();
    if (name) {
      library.createPlaylist(name);
      setPlaylistName('');
    }
  };

  if (openPlaylist) {
    const tracks: Track[] = library.playlists[openPlaylist] ?? [];
    return (
      <View style={styles.screen}>
        <Pressable accessibilityLabel="Volver" onPress={() => setOpenPlaylist(null)} style={styles.back}>
          <Text style={styles.backText}>‹ Biblioteca</Text>
        </Pressable>
        <Text style={styles.heading}>{openPlaylist}</Text>
        <TrackList
          tracks={tracks}
          emptyText="Lista vacía: añade canciones desde Buscar."
          onRemove={(t) => library.removeFromPlaylist(openPlaylist, t.id)}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Tu biblioteca</Text>
      <View style={styles.tabs}>
        {(
          [
            ['favorites', 'Favoritos'],
            ['history', 'Historial'],
            ['playlists', 'Listas'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            onPress={() => setTab(key)}
            style={({ pressed }) => [styles.tab, tab === key && styles.tabActive, pressed && { opacity: 0.8 }]}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'favorites' && (
        <View style={styles.listWrap}>
          <TrackList
            tracks={library.favorites}
            emptyText="Sin favoritos todavía: toca ☆ en cualquier canción."
          />
        </View>
      )}
      {tab === 'history' && (
        <View style={styles.listWrap}>
          <TrackList tracks={library.history} emptyText="Lo que reproduzcas aparecerá aquí." />
        </View>
      )}
      {tab === 'playlists' && (
        <View style={styles.listWrap}>
          <View style={styles.playlistRow}>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la lista"
              placeholderTextColor={Colors.dark.textSecondary}
              value={playlistName}
              onChangeText={setPlaylistName}
              onSubmitEditing={createPlaylist}
              accessibilityLabel="Nombre de la lista"
            />
            <Pressable
              accessibilityLabel="Crear lista"
              onPress={createPlaylist}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
              <Text style={styles.buttonText}>Crear</Text>
            </Pressable>
          </View>
          {Object.keys(library.playlists).length === 0 ? (
            <Text style={styles.empty}>Crea tu primera lista y añade canciones desde Buscar.</Text>
          ) : (
            Object.entries(library.playlists).map(([name, tracks]) => (
              <Pressable
                key={name}
                accessibilityRole="button"
                onPress={() => setOpenPlaylist(name)}
                style={({ pressed }) => [styles.playlistItem, pressed && { opacity: 0.8 }]}>
                <Text style={styles.playlistName}>{name}</Text>
                <Text style={styles.playlistCount}>{tracks.length} canciones</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  heading: {
    color: Colors.dark.heading,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: Spacing.three,
  },
  back: { minHeight: TouchTarget, justifyContent: 'center', marginBottom: Spacing.one },
  backText: { color: Colors.dark.accent, fontSize: 16, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  tab: {
    minHeight: TouchTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.backgroundElement,
  },
  tabActive: { backgroundColor: Colors.dark.accent },
  tabText: { color: Colors.dark.textSecondary, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#FFFFFF' },
  listWrap: { flex: 1, minHeight: 320 },
  playlistRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
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
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.accent,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  empty: { color: Colors.dark.textSecondary, fontSize: 15, lineHeight: 22 },
  playlistItem: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  playlistName: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  playlistCount: { color: Colors.dark.textSecondary, fontSize: 13, marginTop: 2 },
});
