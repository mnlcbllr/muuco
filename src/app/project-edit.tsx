import { router, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { projectColors } from '../core/model';
import { useStore } from '../data/store';
import { Action, Body, Card, Empty, ErrorMessage, Eyebrow, Field, Header, Icon, IconButton, Screen } from '../ui/components';
import { confirm } from '../ui/confirm';
import { useEditorGuard } from '../ui/use-editor';
import { useTheme } from '../ui/theme';

export default function ProjectEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const store = useStore(); const t = useTheme();
  const [original] = useState(() => store.projects.find(project => project.id === id));
  const [recordId] = useState(() => id ?? randomUUID());
  const [name, setName] = useState(original?.name ?? '');
  const [color, setColor] = useState<string>(original?.color ?? projectColors[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const dirty = name !== (original?.name ?? '') || color !== (original?.color ?? projectColors[0]);
  const allow = useEditorGuard(!saved && dirty);
  function leave() { allow(); if (router.canGoBack()) router.back(); else router.replace('/projects'); }
  async function save() {
    if (busy) return; setBusy(true); setError('');
    try { await store.mutate(repo => repo.saveProject(recordId, name, color)); setSaved(true); leave(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this project.'); }
    finally { setBusy(false); }
  }
  async function archive() {
    if (!original || busy || dirty) return;
    if (!original.archived && !await confirm('Archive this project?', 'Its tasks and notes stay on this device. Active tasks and scheduled reminders will still appear in Today. You can restore the project anytime.', 'Archive')) return;
    setBusy(true);
    try { await store.mutate(repo => repo.archiveProject(original.id, !original.archived)); setSaved(true); leave(); }
    catch { setError('Could not update the project.'); }
    finally { setBusy(false); }
  }
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><Screen footer={<View style={{ flex: 1 }}><Action title={busy ? 'Saving…' : original ? 'Save project' : 'Create project'} disabled={busy} onPress={() => void save()} /></View>}>
    <Header eyebrow="Project" title={original ? 'Edit project' : 'A home for your work.'} right={<IconButton name="close" label="Close project editor" onPress={() => router.canGoBack() ? router.back() : router.replace('/projects')} />} />
    {id && !original ? <Empty title="Project not found" detail="Your other projects have not been changed." /> : <>
      <Card style={{ padding: 16, gap: 15 }}>
        <Field label="Project name" value={name} onChange={setName} placeholder="My next good thing" />
        <View style={{ gap: 11 }}>
          <Eyebrow>A little color</Eyebrow>
          <View style={{ flexDirection: 'row', gap: 12 }}>{projectColors.map((choice, index) => <Pressable key={choice} accessibilityRole="button" accessibilityLabel={['Purple', 'Blue', 'Amber', 'Green'][index]} accessibilityState={{ selected: choice === color }} onPress={() => setColor(choice)} style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: choice, alignItems: 'center', justifyContent: 'center', borderWidth: choice === color ? 3 : 0, borderColor: t.surface, boxShadow: choice === color ? '0px 0px 0px 2px rgba(28,22,38,0.18)' : undefined }}>{choice === color && <Icon name="checkmark" color="#FFFFFF" size={22} />}</Pressable>)}</View>
        </View>
      </Card>
      <Card style={{ padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.accentTint, borderWidth: 1, borderColor: t.accentSoft }}>
        <Icon name="sparkles-outline" color={t.accent} />
        <Body style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>Start simple. Add your tasks and notes as you go.</Body>
      </Card>
      <ErrorMessage message={error} />
      {original && <>
        <Action secondary title={original.archived ? 'Restore project' : 'Archive project'} disabled={busy || dirty} onPress={() => void archive()} />
        {dirty && <Body secondary style={{ fontSize: 12, textAlign: 'center' }}>Save your edits before changing the archive status.</Body>}
      </>}
    </>}
  </Screen></KeyboardAvoidingView>;
}
