import { Platform, View } from 'react-native';
import { Body, Card, Eyebrow, Header, Icon, IconTile, Screen, Section, s } from '../ui/components';
import { useTheme } from '../ui/theme';

export default function Settings() {
  const t = useTheme();
  return <Screen><Header title="Settings" subtitle="A small app. Clear boundaries." back />
    <Section title="Your space">
      <Card style={{ paddingHorizontal: 16 }}>
        <View style={[s.row, { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: t.border }]}>
          <IconTile icon="contrast-outline" tone={t.accent} size={40} />
          <View style={{ flex: 1, gap: 2 }}><Body style={{ fontWeight: '600' }}>Appearance</Body><Body secondary style={{ fontSize: 12.5 }}>Follows your device · currently {t.dark ? 'dark' : 'light'}</Body></View>
        </View>
        <View style={[s.row, { paddingVertical: 15 }]}>
          <IconTile icon="phone-portrait-outline" tone={t.success} size={40} />
          <View style={{ flex: 1, gap: 2 }}><Body style={{ fontWeight: '600' }}>Local storage</Body><Body secondary style={{ fontSize: 12.5 }}>{Platform.OS === 'web' ? 'Browser preview · not encrypted' : 'Encrypted on this device'}</Body></View>
        </View>
      </Card>
    </Section>
    <Section title="Privacy">
      <Card style={{ padding: 18, gap: 10 }}>
        <View style={s.row}><IconTile icon="shield-checkmark-outline" tone={t.success} size={40} /><View style={{ flex: 1 }}><Body style={{ fontWeight: '700' }}>No account. No uploads.</Body></View></View>
        <Body secondary style={{ fontSize: 13.5, lineHeight: 20 }}>No AI provider, analytics, or cloud sync. Your tasks stay on this device.</Body>
        <Body secondary style={{ fontSize: 13.5, lineHeight: 20 }}>{Platform.OS === 'web' ? 'This browser preview is not encrypted. Do not enter sensitive information here.' : 'Your database key stays on this device. Android automatic backup is disabled.'}</Body>
      </Card>
    </Section>
    <Card style={{ padding: 18, gap: 10, backgroundColor: t.goldSoft, borderWidth: 1, borderColor: `${t.gold}55` }}>
      <View style={s.row}><Icon name="construct-outline" color={t.text} /><Eyebrow color={t.text}>Early foundation</Eyebrow></View>
      <Body style={{ fontSize: 13.5, lineHeight: 20 }}>Export and restore are not implemented yet. Uninstalling the app can permanently remove your information.</Body>
    </Card>
  </Screen>;
}
