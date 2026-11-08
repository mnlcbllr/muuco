import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Body, Icon, type IconName } from './components';
import { useTheme } from './theme';

const icons: Record<string, IconName> = {
  index: 'sunny-outline',
  projects: 'albums-outline',
  calendar: 'calendar-outline',
};

export function MuucoTabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  const t = useTheme();
  const fallback = useSafeAreaInsets();
  const bottom = Math.max(insets?.bottom ?? fallback.bottom, 10);
  return <View style={{ backgroundColor: t.background, paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottom }}>
    <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', height: 64, borderRadius: 26, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, boxShadow: '0px 10px 28px rgba(28, 22, 38, 0.10)' }}>
      {state.routes.map((route, index) => {
        const options = descriptors[route.key]?.options ?? {};
        const selected = state.index === index;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const icon = icons[route.name] ?? 'ellipse-outline';
        return <Pressable
          key={route.key}
          accessibilityRole="tab"
          accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
          accessibilityState={{ selected }}
          onPress={() => navigateToTab(route.key)}
          style={({ pressed }) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 56, opacity: pressed ? 0.55 : 1 })}
        >
          <View style={{ width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? t.accentSoft : 'transparent' }}>
            <Icon name={icon} size={20} color={selected ? t.accent : t.muted} />
          </View>
          <Body style={{ fontSize: 10.5, lineHeight: 13, fontWeight: selected ? '700' : '500', color: selected ? t.accent : t.muted }}>{label}</Body>
        </Pressable>;
      })}
    </View>
  </View>;
}
