import { Tabs } from 'expo-router/js-tabs';
import { MuucoTabBar } from '../../ui/tab-bar';
import { useTheme } from '../../ui/theme';

export default function TabLayout() {
  const t = useTheme();
  return <Tabs
    tabBar={props => <MuucoTabBar {...props} />}
    screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.background } }}
  >
    <Tabs.Screen name="index" options={{ title: 'Today', tabBarAccessibilityLabel: 'Today' }} />
    <Tabs.Screen name="projects" options={{ title: 'Projects', tabBarAccessibilityLabel: 'Projects' }} />
    <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarAccessibilityLabel: 'Calendar' }} />
  </Tabs>;
}
