import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, TAB_BAR } from '@/constants/theme';

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C9A8FF',
        tabBarInactiveTintColor: '#A8B1DB',
        tabBarLabelStyle: styles.label,
        tabBarIconStyle: { display: 'none' },
        tabBarStyle: {
          height: TAB_BAR + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
          backgroundColor: Colors.dark.backgroundElement,
          borderTopColor: Colors.dark.border,
        },
      }}>
      <Tabs.Screen name="(home)" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="(search)" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="(library)" options={{ title: 'Tu biblioteca' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700' },
});
