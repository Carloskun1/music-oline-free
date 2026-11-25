// Detector de errores: guarda errores en memoria y en disco para poder verlos en pantalla.
export type ErrorEntry = { time: string; tag: string; message: string; stack?: string; fatal?: boolean };

const KEY = 'arabeplayer.lastErrors';
let entries: ErrorEntry[] = [];
const listeners = new Set<() => void>();
let installed = false;

function emit() {
  entries = [...entries];
  listeners.forEach((l) => l());
}

export function subscribeErrors(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
export const getErrors = () => entries;

async function persist() {
  try {
    const AsyncStorage = require('expo-sqlite/kv-store').default;
    await AsyncStorage.setItem(KEY, JSON.stringify(entries.slice(0, 20)));
  } catch {}
}

export async function loadPreviousErrors(): Promise<ErrorEntry[]> {
  try {
    const AsyncStorage = require('expo-sqlite/kv-store').default;
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ErrorEntry[]) : [];
  } catch {
    return [];
  }
}

export async function clearErrors() {
  entries = [];
  emit();
  try {
    const AsyncStorage = require('expo-sqlite/kv-store').default;
    await AsyncStorage.removeItem(KEY);
  } catch {}
}

export function logError(tag: string, err: unknown, fatal = false) {
  const e = err as { message?: string; stack?: string } | undefined;
  const entry: ErrorEntry = {
    time: new Date().toLocaleTimeString(),
    tag,
    message: e?.message ?? String(err),
    stack: e?.stack,
    fatal,
  };
  console.error(`[arabe-player:${tag}]`, entry.message);
  entries = [entry, ...entries].slice(0, 30);
  emit();
  void persist();
}

export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;
  try {
    const EU = (globalThis as any).ErrorUtils;
    if (EU?.setGlobalHandler) {
      // No llamamos al handler original: así la app NO se cierra y mostramos el error.
      EU.setGlobalHandler((error: unknown, isFatal?: boolean) => logError('global', error, !!isFatal));
    }
  } catch {}
  try {
    require('promise/setimmediate/rejection-tracking').enable({
      allRejections: true,
      onUnhandled: (_id: number, error: unknown) => logError('promesa', error),
    });
  } catch {}
}
