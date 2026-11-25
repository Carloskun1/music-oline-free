import { DarkTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
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

export default function RootLayout() {
  const library = useLibraryState();
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <LibraryContext.Provider value={library}>
          <PlayerProvider onPlayTrack={library.addToHistory}>
            {library.loaded ? <AppTabs /> : null}
          </PlayerProvider>
        </LibraryContext.Provider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

