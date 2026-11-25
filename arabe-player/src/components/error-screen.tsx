import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { clearErrors, getErrors, loadPreviousErrors, subscribeErrors, type ErrorEntry } from '@/lib/error-log';

export function useErrors() {
  return useSyncExternalStore(subscribeErrors, getErrors, getErrors);
}

function Line({ e }: { e: ErrorEntry }) {
  return (
    <View style={styles.card}>
      <Text selectable style={styles.tag}>
        {e.time} · {e.tag}
        {e.fatal ? ' · FATAL' : ''}
      </Text>
      <Text selectable style={styles.msg}>
        {e.message}
      </Text>
      {e.stack ? (
        <Text selectable style={styles.stack} numberOfLines={12}>
          {e.stack}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorScreen({ onClose, title = 'Detector de errores' }: { onClose?: () => void; title?: string }) {
  const errors = useErrors();
  const [previous, setPrevious] = useState<ErrorEntry[]>([]);
  useEffect(() => {
    void loadPreviousErrors().then(setPrevious);
  }, []);
  const prevOnly = previous.filter((p) => !errors.some((e) => e.time === p.time && e.message === p.message));

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>Mantén presionado un texto para copiarlo y mándamelo.</Text>
      <ScrollView style={{ flex: 1 }}>
        {errors.length === 0 && prevOnly.length === 0 ? <Text style={styles.hint}>Sin errores registrados.</Text> : null}
        {errors.map((e, i) => (
          <Line key={`n${i}`} e={e} />
        ))}
        {prevOnly.length > 0 ? <Text style={styles.section}>Errores de la sesión anterior</Text> : null}
        {prevOnly.map((e, i) => (
          <Line key={`p${i}`} e={e} />
        ))}
      </ScrollView>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => void clearErrors().then(() => setPrevious([]))}>
          <Text style={styles.btnText}>Borrar</Text>
        </Pressable>
        {onClose ? (
          <Pressable style={[styles.btn, styles.btnMain]} onPress={onClose}>
            <Text style={styles.btnText}>Reintentar / Cerrar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// Barra roja que aparece cuando hay errores pero la app sigue viva.
export function ErrorBanner({ onPress }: { onPress: () => void }) {
  const errors = useErrors();
  if (errors.length === 0) return null;
  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <Text style={styles.bannerText}>⚠ {errors.length} error(es) detectado(s) — toca para ver</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.dark.background, padding: Spacing.three, paddingTop: 48 },
  title: { color: Colors.dark.danger, fontSize: 22, fontWeight: '800' },
  hint: { color: Colors.dark.textSecondary, fontSize: 12, marginVertical: Spacing.two },
  section: { color: Colors.dark.heading, fontWeight: '700', marginTop: Spacing.three },
  card: { backgroundColor: Colors.dark.backgroundElement, borderRadius: 10, padding: Spacing.two, marginBottom: Spacing.two },
  tag: { color: Colors.dark.accent, fontSize: 11, fontWeight: '700' },
  msg: { color: Colors.dark.text, fontSize: 14, marginTop: 4 },
  stack: { color: Colors.dark.textSecondary, fontSize: 10, marginTop: 4 },
  row: { flexDirection: 'row', gap: Spacing.two, paddingVertical: Spacing.three },
  btn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: Colors.dark.backgroundSelected, alignItems: 'center' },
  btnMain: { backgroundColor: Colors.dark.accent },
  btnText: { color: '#fff', fontWeight: '700' },
  banner: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: Colors.dark.danger, paddingTop: 36, paddingBottom: 8, paddingHorizontal: 12, zIndex: 99 },
  bannerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
