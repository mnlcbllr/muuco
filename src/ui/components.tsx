import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,
  type StyleProp, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ComponentProps, ReactNode } from 'react';
import { moodArt } from './mood-art';
import { moodLabels, type MuucoMood } from './mood';
import { useTheme } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

const cardShadow = Platform.select({
  web: { boxShadow: '0px 10px 30px rgba(28, 22, 38, 0.06)' },
  default: { shadowColor: '#1C1626', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
}) as ViewStyle;
const floatShadow = Platform.select({
  web: { boxShadow: '0px 14px 34px rgba(35, 25, 60, 0.22)' },
  default: { shadowColor: '#241F33', shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 9 },
}) as ViewStyle;

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.secondary} accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />;
}

export function Body({ secondary, style, ...props }: TextProps & { secondary?: boolean }) {
  const t = useTheme();
  return <Text {...props} style={[{ color: secondary ? t.secondary : t.text, fontSize: 15.5, lineHeight: 22 }, style]} />;
}

export function Heading({ children, small = false, style }: { children: ReactNode; small?: boolean; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text accessibilityRole="header" style={[{ color: t.text, fontSize: small ? 22 : 32, fontWeight: '700', letterSpacing: small ? -0.6 : -1.2, lineHeight: small ? 28 : 38 }, style]}>{children}</Text>;
}

export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  const t = useTheme();
  return <Text style={{ color: color ?? t.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.7, textTransform: 'uppercase' }}>{children}</Text>;
}

export function IconButton({ name, label, onPress, active = false }: { name: IconName; label: string; onPress: () => void; active?: boolean }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: active ? 'transparent' : t.border, backgroundColor: active ? t.accentSoft : t.surface, opacity: pressed ? 0.55 : 1 })}><Icon name={name} size={20} color={active ? t.accent : t.text} /></Pressable>;
}

export function Action({ title, onPress, secondary = false, disabled = false, icon }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; icon?: IconName }) {
  const t = useTheme();
  const foreground = secondary ? t.accent : t.dark ? '#171122' : '#FFFFFF';
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, { backgroundColor: secondary ? t.accentSoft : t.accent, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}>
    {icon && <Icon name={icon} size={18} color={foreground} />}<Body style={{ color: foreground, fontWeight: '700', fontSize: 15, textAlign: 'center' }}>{title}</Body>
  </Pressable>;
}

export function IconTile({ icon, tone, soft, size = 44 }: { icon: IconName; tone: string; soft?: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: soft ?? `${tone}1A`, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} color={tone} size={size * 0.46} /></View>;
}

export function Owl({ size = 48, mood }: { size?: number; mood?: MuucoMood }) {
  const source = mood ? moodArt[mood] : require('../../assets/brand/avatar.png');
  const label = mood ? `Muuco, ${moodLabels[mood]}` : 'Muuco, a purple owl with a golden scarf';
  return <Image source={source} accessibilityLabel={label} style={{ width: size, height: size, ...(mood ? null : { borderRadius: size * 0.3 }) }} />;
}

export function Screen({ children, scroll = true, padded = true, fab, fabInset = false, footer }: { children: ReactNode; scroll?: boolean; padded?: boolean; fab?: ReactNode; fabInset?: boolean; footer?: ReactNode }) {
  const t = useTheme(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const content = <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: padded ? 20 : 0, paddingTop: 4, paddingBottom: (fab ? 96 : 36) + insets.bottom, gap: 18 }}>{children}</View>;
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
    <View style={{ flex: 1 }}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 20 }}>{content}</ScrollView> : content}
      {!!fab && <View pointerEvents="box-none" style={{ position: 'absolute', right: Math.max(20, (width - 600) / 2 + 20), bottom: (fabInset ? insets.bottom + 12 : 0) + 18 }}>{fab}</View>}
    </View>
    {footer && <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, backgroundColor: t.surface, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(12, insets.bottom) }}>
      <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', gap: 10 }}>{footer}</View>
    </View>}
  </SafeAreaView>;
}

export function Header({ title, subtitle, back = false, right, eyebrow }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode; eyebrow?: string }) {
  const t = useTheme();
  return <View style={{ gap: 3, paddingTop: 2 }}>
    <View style={[s.between, { alignItems: 'flex-start' }]}>
      <View style={{ flex: 1, gap: 3 }}>
        {(back || eyebrow) && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: back ? 34 : 14 }}>
          {back && <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={({ pressed }) => ({ width: 36, height: 36, marginLeft: -5, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, opacity: pressed ? 0.55 : 1 })}><Icon name="chevron-back" size={19} color={t.text} /></Pressable>}
          {!!eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        </View>}
        <Text accessibilityRole="header" style={{ color: t.text, fontSize: 26, lineHeight: 31, fontWeight: '700', letterSpacing: -0.8 }}>{title}</Text>
        {subtitle && <Body secondary style={{ fontSize: 13, lineHeight: 18 }}>{subtitle}</Body>}
      </View>
      {!!right && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 1 }}>{right}</View>}
    </View>
  </View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.surface, borderRadius: 24, overflow: 'hidden', borderWidth: t.dark ? 1 : 0, borderColor: t.border }, cardShadow, style]}>{children}</View>;
}

export function Section({ title, children, action, onAction, count }: { title: string; children: ReactNode; action?: string; onAction?: () => void; count?: number }) {
  const t = useTheme();
  return <View style={{ gap: 12 }}>
    <View style={s.between}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flex: 1 }}>
        <Text accessibilityRole="header" style={{ color: t.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.35 }}>{title}</Text>
        {count !== undefined && Boolean(count) && <View style={{ minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, backgroundColor: t.surfaceTint, alignItems: 'center', justifyContent: 'center' }}><Body secondary style={{ fontSize: 12, lineHeight: 16, fontWeight: '700' }}>{count}</Body></View>}
      </View>
      {action && <Pressable accessibilityRole="button" onPress={onAction} style={{ minHeight: 40, justifyContent: 'center', paddingLeft: 10 }}><Body style={{ color: t.accent, fontSize: 14, fontWeight: '700' }}>{action}</Body></Pressable>}
    </View>
    {children}
  </View>;
}

export function Empty({ icon = 'leaf-outline', title, detail, action, onAction }: { icon?: IconName; title: string; detail: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return <Card style={{ padding: 24, gap: 9 }}>
    <IconTile icon={icon} tone={t.accent} size={46} />
    <Body style={{ fontWeight: '700', fontSize: 17, letterSpacing: -0.3 }}>{title}</Body>
    <Body secondary style={{ fontSize: 14, lineHeight: 21 }}>{detail}</Body>
    {action && onAction && <View style={{ alignSelf: 'flex-start', marginTop: 8 }}><Action title={action} secondary onPress={onAction} /></View>}
  </Card>;
}

export function Search({ value, onChange, placeholder = 'Search your space' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const t = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.surface, borderRadius: 18, borderWidth: 1, borderColor: t.border, paddingLeft: 15, paddingRight: 3, minHeight: 52 }}>
    <Icon name="search-outline" size={19} color={t.muted} />
    <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={t.muted} style={[{ flex: 1, minHeight: 50, color: t.text, fontSize: 15.5 }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null]} returnKeyType="search" clearButtonMode="while-editing" />
    {value !== '' && Platform.OS !== 'ios' && <IconButton name="close-circle" label="Clear search" onPress={() => onChange('')} />}
  </View>;
}

export function Field({ label, value, onChange, placeholder, multiline = false, compact = false, numeric = false, autoFocus = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; compact?: boolean; numeric?: boolean; autoFocus?: boolean }) {
  const t = useTheme(); const [focused, setFocused] = useState(false);
  return <View style={{ gap: 8 }}>
    <Body secondary style={{ fontSize: 13, fontWeight: '700' }}>{label}</Body>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder} placeholderTextColor={t.muted} multiline={multiline} keyboardType={numeric ? 'number-pad' : 'default'} autoFocus={autoFocus} style={[{ backgroundColor: t.surface, borderWidth: 1, borderColor: focused ? t.accent : t.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 15, color: t.text, fontSize: 16, minHeight: multiline ? (compact ? 104 : 150) : 56, textAlignVertical: multiline ? 'top' : 'center' }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null]} />
  </View>;
}

export function Chip({ label, selected = false, dot, onPress }: { label: string; selected?: boolean; dot?: string; onPress: () => void }) {
  const t = useTheme();
  const foreground = selected ? (t.dark ? '#171122' : '#FFFFFF') : t.text;
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => ({ minHeight: 40, borderWidth: 1, borderColor: selected ? t.accent : t.border, backgroundColor: selected ? t.accent : t.surface, opacity: pressed ? 0.7 : 1, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 15 })}>
    {dot && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: selected ? foreground : dot }} />}
    <Body style={{ color: foreground, fontSize: 13.5, fontWeight: selected ? '700' : '500' }}>{label}</Body>
  </Pressable>;
}

export function Segments<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  const t = useTheme();
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 4, gap: 4, borderRadius: 18, backgroundColor: t.surfaceTint, borderWidth: 1, borderColor: t.border }}>
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} style={{ flex: 1, minHeight: 42, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 14, backgroundColor: value === option.value ? t.surface : 'transparent', ...(value === option.value ? cardShadow : {}) }}><Body style={{ fontSize: 13.5, textAlign: 'center', fontWeight: value === option.value ? '700' : '500', color: value === option.value ? t.text : t.secondary }}>{option.label}</Body></Pressable>)}
  </View>;
}

export function ErrorMessage({ message }: { message: string }) {
  const t = useTheme();
  return message ? <Body accessibilityRole="alert" style={{ color: t.danger, fontSize: 14 }}>{message}</Body> : null;
}

export function FabMenu({ items }: { items: { icon: IconName; label: string; onPress: () => void }[] }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const animation = useMemo(() => new Animated.Value(0), []);
  function toggle() {
    const next = !open; setOpen(next);
    Animated.timing(animation, { toValue: next ? 1 : 0, duration: 170, useNativeDriver: Platform.OS === 'web' ? false : true, easing: Easing.out(Easing.ease) }).start();
  }
  const menuStyle = { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] };
  return <View style={{ gap: 12, alignItems: 'flex-end' }}>
    {open && <Animated.View style={[menuStyle, { gap: 10, alignItems: 'stretch' }]}>
      {items.map(item => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => { setOpen(false); item.onPress(); }} style={({ pressed }) => [s.fabItem, { backgroundColor: t.surface, borderColor: t.border }, floatShadow, { opacity: pressed ? 0.7 : 1 }]}>
        <Icon name={item.icon} size={19} color={t.accent} /><Body style={{ fontSize: 15, fontWeight: '600' }}>{item.label}</Body>
      </Pressable>)}
    </Animated.View>}
    <Pressable accessibilityRole="button" accessibilityLabel={open ? 'Close quick actions' : 'Quick actions'} accessibilityState={{ expanded: open }} onPress={toggle} style={({ pressed }) => [s.fab, floatShadow, { backgroundColor: t.accent, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name={open ? 'close' : 'add'} size={26} color={t.dark ? '#171122' : t.white} />
    </Pressable>
  </View>;
}

export const s = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  action: { minHeight: 54, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fab: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  fabItem: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 18, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 18 },
});
