import { DarkTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { ErrorBanner, ErrorScreen } from '@/components/error-screen';
import { PlayerProvider } from '@/components/player-provider';
import { Colors } from '@/constants/theme';
import { LibraryContext, useLibraryState } from '@/lib/library';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    primary: Colors.dark.accent,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function AppRoot() {
  const library = useLibraryState();
  const [showErrors, setShowErrors] = useState(false);

  if (showErrors) return <ErrorScreen onClose={() => setShowErrors(false)} />;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <LibraryContext.Provider value={library}>
          <PlayerProvider onPlayTrack={library.addToHistory}>
            {library.loaded ? <AppTabs /> : null}
          </PlayerProvider>
        </LibraryContext.Provider>
        <ErrorBanner onPress={() => setShowErrors(true)} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
