import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayer } from '@/components/player-context';
import { Colors, MINI_PLAYER, Radius, Spacing, TAB_BAR } from '@/constants/theme';
import type { Track } from '@/lib/api';
import { useLibrary } from '@/lib/library';

type OpenOpts = { onRemove?: () => void; removeLabel?: string };
type MenuApi = { open: (track: Track, opts?: OpenOpts) => void; toast: (msg: string) => void };

const MenuContext = createContext<MenuApi | null>(null);

export function useTrackMenu(): MenuApi {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useTrackMenu debe usarse dentro de TrackMenuProvider');
  return ctx;
}

export function TrackMenuProvider({ children }: { children: ReactNode }) {
  const library = useLibrary();
  const player = usePlayer();
  const insets = useSafeAreaInsets();
  const [track, setTrack] = useState<Track | null>(null);
  const [opts, setOpts] = useState<OpenOpts>({});
  const [view, setView] = useState<'main' | 'lists'>('main');
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = (msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 1800);
  };

  const open = (t: Track, o: OpenOpts = {}) => {
    setTrack(t);
    setOpts(o);
    setView('main');
    setNewName('');
  };
  const close = () => setTrack(null);

  const run = (fn: () => void, msg: string) => {
    fn();
    close();
    toast(msg);
  };

  const liked = track ? library.isFavorite(track.id) : false;
  const names = Object.keys(library.playlists);

  return (
    <MenuContext.Provider value={{ open, toast }}>
      {children}
      {message ? (
        <View pointerEvents="none" style={[styles.toast, { bottom: TAB_BAR + insets.bottom + MINI_PLAYER + 8 }]}>
          <Text style={styles.toastText}>{message}</Text>
        </View>
      ) : null}
      <Modal visible={track !== null} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={close} />
        {track ? (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.head}>
              {track.thumbnail ? (
                <Image source={{ uri: track.thumbnail }} style={styles.art} />
              ) : (
                <View style={[styles.art, { backgroundColor: Colors.dark.backgroundSelected }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.title}>
                  {track.title}
                </Text>
                <Text numberOfLines={1} style={styles.artist}>
                  {track.uploader}
                </Text>
              </View>
            </View>

            {view === 'main' ? (
              <>
                <Item
                  icon={liked ? '♥' : '♡'}
                  label={liked ? 'Quitar de Me gusta' : 'Añadir a Me gusta'}
                  onPress={() => run(() => library.toggleFavorite(track), liked ? 'Quitada de Me gusta' : 'Añadida a Me gusta')}
                />
                <Item icon="＋" label="Añadir a una lista" onPress={() => setView('lists')} />
                <Item icon="▶" label="Reproducir a continuación" onPress={() => run(() => player.playNext(track), 'Sonará a continuación')} />
                <Item icon="☰" label="Añadir a la cola" onPress={() => run(() => player.addToQueue(track), 'Añadida a la cola')} />
                {opts.onRemove ? (
                  <Item
                    icon="✕"
                    danger
                    label={opts.removeLabel ?? 'Quitar de esta lista'}
                    onPress={() => run(() => opts.onRemove?.(), 'Quitada')}
                  />
                ) : null}
              </>
            ) : (
              <>
                <Pressable onPress={() => setView('main')} style={styles.backRow}>
                  <Text style={styles.backText}>‹ Volver</Text>
                </Pressable>
                <View style={styles.newRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva lista..."
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={newName}
                    onChangeText={setNewName}
                  />
                  <Pressable
                    style={styles.newBtn}
                    onPress={() => {
                      const n = newName.trim();
                      if (!n) return;
                      run(() => {
                        library.createPlaylist(n);
                        library.addToPlaylist(n, track);
                      }, `Añadida a "${n}"`);
                    }}>
                    <Text style={styles.newBtnText}>Crear</Text>
                  </Pressable>
                </View>
                <ScrollView style={{ maxHeight: 240 }}>
                  {names.length === 0 ? <Text style={styles.empty}>Aún no tienes listas. Crea una arriba.</Text> : null}
                  {names.map((n) => (
                    <Item
                      key={n}
                      icon="♫"
                      label={`${n}  ·  ${library.playlists[n]?.length ?? 0}`}
                      onPress={() => run(() => library.addToPlaylist(n, track), `Añadida a "${n}"`)}
                    />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        ) : null}
      </Modal>
    </MenuContext.Provider>
  );
}

function Item({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.itemIcon, danger && { color: Colors.dark.danger }]}>{icon}</Text>
      <Text style={[styles.itemLabel, danger && { color: Colors.dark.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.dark.backgroundElement,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.three,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingBottom: Spacing.three, borderBottomWidth: 1, borderBottomColor: Colors.dark.border, marginBottom: Spacing.two },
  art: { width: 52, height: 52, borderRadius: 8 },
  title: { color: Colors.dark.text, fontSize: 16, fontWeight: '700' },
  artist: { color: Colors.dark.textSecondary, fontSize: 13 },
  item: { flexDirection: 'row', alignItems: 'center', minHeight: 50, gap: Spacing.three },
  itemIcon: { color: Colors.dark.heading, fontSize: 20, width: 28, textAlign: 'center' },
  itemLabel: { color: Colors.dark.text, fontSize: 16 },
  backRow: { minHeight: 40, justifyContent: 'center' },
  backText: { color: Colors.dark.accent, fontWeight: '700', fontSize: 15 },
  newRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  input: { flex: 1, minHeight: 44, backgroundColor: Colors.dark.background, borderRadius: Radius.md, color: Colors.dark.text, paddingHorizontal: Spacing.three },
  newBtn: { minHeight: 44, paddingHorizontal: Spacing.four, borderRadius: Radius.md, backgroundColor: Colors.dark.accent, alignItems: 'center', justifyContent: 'center' },
  newBtnText: { color: '#fff', fontWeight: '700' },
  empty: { color: Colors.dark.textSecondary, paddingVertical: Spacing.three },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  toastText: { color: '#0A0E2A', fontWeight: '700', fontSize: 13 },
});
