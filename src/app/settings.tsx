import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useStore } from '../data/store';
import { requestReminders } from '../data/notifications';
import { Action, Body, Card, ErrorMessage, Header, Icon, Screen, Section, s } from '../ui/components';
import { useTheme } from '../ui/theme';

export default function Settings() {
  const t = useTheme(); const store = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function enable() {
    if (busy) return; setBusy(true); setError('');
    try { const granted = await requestReminders(); await store.refresh(); if (!granted && Platform.OS !== 'web') await Linking.openSettings(); }
    catch { setError('Could not update reminders. Your tasks are still saved.'); }
    finally { setBusy(false); }
  }
  return <Screen><Header title="Settings" subtitle="A small app. Clear boundaries." back />
    <Section title="Your space"><Card style={{ padding: 20, gap: 20 }}><View style={s.row}><Icon name="contrast-outline" color={t.accent} /><View style={{ flex: 1, gap: 4 }}><Body>Appearance</Body><Body secondary style={{ fontSize: 13 }}>Follows your device · currently {t.dark ? 'dark' : 'light'}</Body></View></View><View style={s.row}><Icon name="phone-portrait-outline" color={t.accent} /><View style={{ flex: 1, gap: 4 }}><Body>Local storage</Body><Body secondary style={{ fontSize: 13 }}>{Platform.OS === 'web' ? 'Browser preview · not encrypted' : 'Encrypted SQLite · key stored on this device'}</Body></View></View></Card></Section>
    <Section title="Reminders"><Card style={{ padding: 20, gap: 14 }}><Body style={{ fontWeight: '600' }}>{store.reminders.state === 'ready' ? 'Ready for a little nudge' : store.reminders.state === 'unsupported' ? 'Mobile builds only' : 'Reminders need attention'}</Body><Body secondary style={{ fontSize: 14 }}>{store.reminders.message}</Body><Body secondary style={{ fontSize: 13 }}>Reminders are scheduled on the phone, not a server. Permission, battery restrictions, and system settings can affect delivery. Task details are not shown in the notification.</Body>{Platform.OS !== 'web' && <Action title={busy ? 'Checking…' : 'Enable or check reminders'} secondary disabled={busy} onPress={() => void enable()} />}</Card></Section>
    <Section title="Privacy"><Card style={{ padding: 20, gap: 14 }}><Body style={{ fontWeight: '600' }}>No account. No automatic uploads.</Body><Body secondary style={{ fontSize: 14 }}>This build has no connected AI provider, analytics, cloud sync, or remote notification service.</Body><Body secondary style={{ fontSize: 14 }}>{Platform.OS === 'web' ? 'This browser version is for interface testing. Its database is not encrypted. Clearing site data will remove it. Do not enter sensitive information here.' : 'Your database key stays on this device. Device compromise and third-party keyboards are outside Muuco’s protection. Android automatic app backup is disabled.'}</Body></Card></Section>
    <Card style={{ padding: 20, gap: 10, backgroundColor: t.goldSoft }}><View style={s.row}><Icon name="construct-outline" color={t.text} /><Body style={{ fontWeight: '600' }}>An early foundation, not a finished release</Body></View><Body style={{ fontSize: 14 }}>Encrypted export and restore are not implemented yet. Do not use this build as the only copy of important work. Uninstalling the app can permanently remove your information.</Body></Card>
    <ErrorMessage message={error} /><Body secondary style={{ textAlign: 'center', fontSize: 12 }}>Muuco · a little less to remember</Body>
  </Screen>;
}
