import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { dateFromKey, dateKey, timeKey } from '../core/model';
import { Body, Icon } from './components';
import { useTheme } from './theme';

export type DateFieldProps = { label: string; value: string; mode: 'date' | 'time'; onChange: (value: string) => void };
export default function DateField({ label, value, mode, onChange }: DateFieldProps) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const date = mode === 'date' ? dateFromKey(value) : new Date();
  if (mode === 'time') { const [hours, minutes] = value.split(':').map(Number); date.setHours(hours, minutes, 0, 0); }
  const picker = <DateTimePicker accessibilityLabel={label} value={date} mode={mode} display="default" themeVariant={t.dark ? 'dark' : 'light'} accentColor={t.accent} onDismiss={() => setOpen(false)} onValueChange={(_event, selected) => { setOpen(false); onChange(mode === 'date' ? dateKey(selected) : timeKey(selected)); }} />;
  return <View style={{ gap: 8 }}><Body secondary style={{ fontSize: 13, fontWeight: '700' }}>{label}</Body><View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, paddingHorizontal: 12, borderRadius: 18, minHeight: 56, justifyContent: 'center' }}>
    {Platform.OS === 'ios' ? picker : <><Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, paddingHorizontal: 2 }}><Icon name={mode === 'date' ? 'calendar-outline' : 'time-outline'} color={t.accent} size={20} /><Body style={{ fontSize: 15.5 }}>{mode === 'date' ? date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Body></Pressable>{open && picker}</>}
  </View></View>;
}
