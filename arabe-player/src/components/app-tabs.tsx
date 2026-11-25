import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C9A8FF',
        tabBarInactiveTintColor: '#A8B1DB',
        tabBarLabelStyle: styles.label,
        tabBarIconStyle: { display: 'none' },
        tabBarStyle: [
          styles.tabs,
          { backgroundColor: Colors.dark.backgroundElement, borderTopColor: Colors.dark.border },
        ],
      }}>
      <Tabs.Screen
        name="(home)"
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <TabGlyph glyph="♫" color={color} /> }}
      />
      <Tabs.Screen
        name="(search)"
        options={{ title: 'Buscar', tabBarIcon: ({ color }) => <TabGlyph glyph="⌕" color={color} /> }}
      />
      <Tabs.Screen
        name="(library)"
        options={{ title: 'Biblioteca', tabBarIcon: ({ color }) => <TabGlyph glyph="☰" color={color} /> }}
      />
    </Tabs>
  );
}

function TabGlyph({ glyph, color }: { glyph: string; color?: unknown }) {
  return (
    <Text
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.glyph, { color } as { color?: never }]}>
      {glyph}
    </Text>
  );
}

const styles = StyleSheet.create({
  tabs: { height: 72, paddingBottom: 12, paddingTop: 8 },
  label: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  glyph: { fontSize: 22, lineHeight: 26 },
});
