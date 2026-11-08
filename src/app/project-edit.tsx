import { router, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { projectColors } from '../core/model';
import { useStore } from '../data/store';
import { Action, Body, Empty, ErrorMessage, Field, Header, Icon, IconButton, Screen } from '../ui/components';
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
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><Screen><Header title={original ? 'Edit project' : 'A home for your work.'} back right={<IconButton name="close" label="Close project editor" onPress={() => router.canGoBack() ? router.back() : router.replace('/projects')} />} />
    {id && !original ? <Empty title="Project not found" detail="Your other projects have not been changed." /> : <><Field label="Project name" value={name} onChange={setName} placeholder="My next good thing" /><Body secondary>Start simple. Add your tasks and notes as you go.</Body><View style={{ gap: 12 }}><Body secondary style={{ fontSize: 13, fontWeight: '600' }}>A little color</Body><View style={{ flexDirection: 'row', gap: 14 }}>{projectColors.map((choice, index) => <Pressable key={choice} accessibilityRole="button" accessibilityLabel={['Purple', 'Blue', 'Amber', 'Green'][index]} accessibilityState={{ selected: choice === color }} onPress={() => setColor(choice)} style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: choice, alignItems: 'center', justifyContent: 'center', borderWidth: choice === color ? 3 : 0, borderColor: t.text }}>{choice === color && <Icon name="checkmark" color="#FFFFFF" />}</Pressable>)}</View></View><ErrorMessage message={error} /><Action title={busy ? 'Saving…' : original ? 'Save project' : 'Create project'} disabled={busy} onPress={() => void save()} />{original && <><Action secondary title={original.archived ? 'Restore project' : 'Archive project'} disabled={busy || dirty} onPress={() => void archive()} />{dirty && <Body secondary style={{ fontSize: 12 }}>Save your edits before changing the archive status.</Body>}</>}</>}
  </Screen></KeyboardAvoidingView>;
}
