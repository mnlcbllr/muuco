import { View } from 'react-native';
import type { DateFieldProps } from './date-field';
import { Body } from './components';
import { useTheme } from './theme';

export default function DateField({ label, value, mode, onChange }: DateFieldProps) {
  const t = useTheme();
  return <View style={{ gap: 8 }}><Body secondary style={{ fontSize: 13, fontWeight: '600' }}>{label}</Body><input aria-label={label} type={mode} value={value} onChange={event => onChange(event.target.value)} style={{ boxSizing: 'border-box', width: '100%', minHeight: 54, border: 'none', borderRadius: 14, background: t.surface, color: t.text, padding: '12px 16px', font: 'inherit', fontSize: 16, colorScheme: t.dark ? 'dark' : 'light' }} /></View>;
}
