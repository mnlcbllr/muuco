import { Tabs } from 'expo-router';
import { Icon } from '../../ui/components';
import { useTheme } from '../../ui/theme';

// Browser preview. Android and iOS use the platform-native tab bar in _layout.native.tsx.
export default function TabLayout() {
  const t = useTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: t.accent, tabBarInactiveTintColor: t.secondary, tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, height: 76, paddingTop: 10, paddingBottom: 12 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '500' } }}>
    <Tabs.Screen name="index" options={{ title: 'Today', tabBarAccessibilityLabel: 'Today', tabBarIcon: ({ color }) => <Icon name="sunny-outline" color={typeof color === 'string' ? color : t.accent} /> }} />
    <Tabs.Screen name="projects" options={{ title: 'Projects', tabBarAccessibilityLabel: 'Projects', tabBarIcon: ({ color }) => <Icon name="albums-outline" color={typeof color === 'string' ? color : t.accent} /> }} />
    <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarAccessibilityLabel: 'Calendar', tabBarIcon: ({ color }) => <Icon name="calendar-outline" color={typeof color === 'string' ? color : t.accent} /> }} />
  </Tabs>;
}
