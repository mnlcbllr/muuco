import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../ui/theme';

export default function TabLayout() {
  const t = useTheme();
  return <NativeTabs tintColor={t.accent} backgroundColor={t.surface}>
    <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf="sun.max" md="light_mode" /><NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="projects"><NativeTabs.Trigger.Icon sf="square.stack" md="view_agenda" /><NativeTabs.Trigger.Label>Projects</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="calendar"><NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" /><NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label></NativeTabs.Trigger>
  </NativeTabs>;
}
