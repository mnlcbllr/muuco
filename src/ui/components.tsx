import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ComponentProps, ReactNode } from 'react';
import { useTheme } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme(); return <Ionicons name={name} size={size} color={color ?? t.secondary} accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />;
}
export function Body({ secondary, style, ...props }: TextProps & { secondary?: boolean }) {
  const t = useTheme(); return <Text {...props} style={[{ color: secondary ? t.secondary : t.text, fontSize: 16, lineHeight: 23 }, style]} />;
}
export function Heading({ children, small = false }: { children: ReactNode; small?: boolean }) {
  const t = useTheme(); return <Text accessibilityRole="header" style={{ color: t.text, fontSize: small ? 21 : 30, fontWeight: '700', letterSpacing: small ? -0.4 : -0.9 }}>{children}</Text>;
}
export function IconButton({ name, label, onPress, active = false }: { name: IconName; label: string; onPress: () => void; active?: boolean }) {
  const t = useTheme(); return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: active ? t.accentSoft : 'transparent', opacity: pressed ? 0.5 : 1 })}><Icon name={name} color={t.accent} /></Pressable>;
}
export function Action({ title, onPress, secondary = false, disabled = false, icon }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; icon?: IconName }) {
  const t = useTheme();
  const foreground = secondary ? t.accentText : t.dark ? '#21162F' : '#FFFFFF';
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, { backgroundColor: secondary ? t.accentSoft : t.accent, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}>
    {icon && <Icon name={icon} size={19} color={foreground} />}<Body style={{ color: foreground, fontWeight: '600', textAlign: 'center' }}>{title}</Body>
  </Pressable>;
}
export function Owl({ size = 48 }: { size?: number }) {
  return <Image source={require('../../assets/brand/avatar.png')} accessibilityLabel="Muuco, a purple owl with a golden scarf" style={{ width: size, height: size, borderRadius: size * 0.28 }} />;
}
export function Screen({ children, scroll = true, padded = true }: { children: ReactNode; scroll?: boolean; padded?: boolean }) {
  const t = useTheme();
  const content = <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: padded ? 22 : 0, paddingBottom: 36, gap: 24 }}>{children}</View>;
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
    {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 24 }}>{content}</ScrollView> : content}
  </SafeAreaView>;
}
export function Header({ title, subtitle, back = false, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  const t = useTheme();
  return <View style={{ gap: 9, paddingTop: 12 }}>
    <View style={s.between}>
      {back ? <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ minHeight: 48, flexDirection: 'row', gap: 3, alignItems: 'center', paddingRight: 12 }}><Icon name="chevron-back" size={22} color={t.accent} /><Body style={{ color: t.accentText }}>Back</Body></Pressable> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.success }} /><Body secondary style={{ fontSize: 12, fontWeight: '500', letterSpacing: 1.8 }}>YOUR PERSONAL SPACE</Body></View>}
      {right ?? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><IconButton name="add" label="Quick capture" onPress={() => router.push('/capture')} /><Pressable accessibilityRole="button" accessibilityLabel="Ask Muuco" onPress={() => router.push('/assistant')} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Owl size={38} /></Pressable></View>}
    </View>
    <Heading>{title}</Heading>
    {subtitle && <Body secondary style={{ fontSize: 14 }}>{subtitle}</Body>}
  </View>;
}
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme(); return <View style={[{ backgroundColor: t.surface, borderRadius: 20, overflow: 'hidden' }, style]}>{children}</View>;
}
export function Section({ title, children, action, onAction, count }: { title: string; children: ReactNode; action?: string; onAction?: () => void; count?: number }) {
  const t = useTheme(); return <View style={{ gap: 12 }}><View style={s.between}><View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><Heading small>{title}</Heading>{count !== undefined && <Body secondary style={{ fontSize: 14 }}>{count}</Body>}</View>{action && <Pressable accessibilityRole="button" onPress={onAction} style={{ minHeight: 44, justifyContent: 'center' }}><Body style={{ color: t.accentText, fontSize: 14, fontWeight: '500' }}>{action}</Body></Pressable>}</View>{children}</View>;
}
export function Empty({ icon = 'leaf-outline', title, detail, action, onAction }: { icon?: IconName; title: string; detail: string; action?: string; onAction?: () => void }) {
  const t = useTheme(); return <Card style={{ padding: 24, gap: 10 }}><View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accentSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}><Icon name={icon} color={t.accentText} /></View><Body style={{ fontWeight: '600', fontSize: 17 }}>{title}</Body><Body secondary style={{ fontSize: 14, lineHeight: 21 }}>{detail}</Body>{action && onAction && <View style={{ alignSelf: 'flex-start', marginTop: 6 }}><Action title={action} secondary onPress={onAction} /></View>}</Card>;
}
export function Search({ value, onChange, placeholder = 'Search your space' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const t = useTheme(); return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.inset, borderRadius: 13, paddingLeft: 13, paddingRight: 5 }}><Icon name="search-outline" size={19} /><TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={t.secondary} style={{ flex: 1, minHeight: 48, color: t.text, fontSize: 16 }} returnKeyType="search" clearButtonMode="while-editing" />{value !== '' && Platform.OS !== 'ios' && <IconButton name="close-circle" label="Clear search" onPress={() => onChange('')} />}</View>;
}
export function Field({ label, value, onChange, placeholder, multiline = false, numeric = false, autoFocus = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; numeric?: boolean; autoFocus?: boolean }) {
  const t = useTheme(); return <View style={{ gap: 9 }}><Body secondary style={{ fontSize: 13, fontWeight: '600' }}>{label}</Body><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={t.secondary} multiline={multiline} keyboardType={numeric ? 'number-pad' : 'default'} autoFocus={autoFocus} style={{ backgroundColor: t.surface, borderRadius: 14, padding: 16, color: t.text, fontSize: 17, minHeight: multiline ? 160 : 54, textAlignVertical: multiline ? 'top' : 'center' }} /></View>;
}
export function Segments<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  const t = useTheme(); return <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 4, gap: 4, borderRadius: 13, backgroundColor: t.inset }}>
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} style={{ flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 10, backgroundColor: value === option.value ? t.surface : 'transparent' }}><Body style={{ fontSize: 14, textAlign: 'center', fontWeight: value === option.value ? '600' : '400', color: value === option.value ? t.text : t.secondary }}>{option.label}</Body></Pressable>)}
  </View>;
}
export function ErrorMessage({ message }: { message: string }) {
  const t = useTheme(); return message ? <Body accessibilityRole="alert" style={{ color: t.danger, fontSize: 14 }}>{message}</Body> : null;
}
export const s = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  action: { minHeight: 48, borderRadius: 13, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
