import { router, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useStore } from '../data/store';
import { Action, Body, Card, Empty, ErrorMessage, Field, Header, IconButton, Screen } from '../ui/components';
import { confirm } from '../ui/confirm';
import { useEditorGuard } from '../ui/use-editor';
import { useTheme } from '../ui/theme';

export default function Capture() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const store = useStore(); const t = useTheme();
  const capture = store.captures.find(item => item.id === id);
  const [recordId] = useState(randomUUID);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const allow = useEditorGuard(!saved && !id && Boolean(text));
  function leave() { allow(); if (router.canGoBack()) router.back(); else router.replace('/'); }
  async function save() {
    if (busy) return; setBusy(true); setError('');
    try { await store.mutate(repo => repo.addCapture(recordId, text)); setSaved(true); leave(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save. Your thought is still here.'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!id || busy || !await confirm('Delete this thought?', 'This removes the capture from this device and cannot be undone.')) return;
    setBusy(true);
    try { await store.mutate(repo => repo.remove('capture', id)); leave(); }
    catch { setError('Could not delete this capture.'); }
    finally { setBusy(false); }
  }
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><Screen><Header title={id ? 'A captured thought' : 'Get it out of your head.'} back right={<IconButton name="close" label="Close capture" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />} />
    {id ? capture ? <><Card style={{ padding: 22 }}><Body selectable>{capture.text}</Body></Card><Body secondary>You don’t have to organize everything right away. When you’re ready, give this thought a home.</Body><Action title="Turn into a task" icon="checkmark-circle-outline" onPress={() => router.replace({ pathname: '/edit', params: { kind: 'task', captureId: id } })} /><Action title="Keep as a note" secondary icon="document-text-outline" onPress={() => router.replace({ pathname: '/edit', params: { kind: 'note', captureId: id } })} /><Pressable accessibilityRole="button" disabled={busy} onPress={() => void remove()} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center' }}><Body style={{ color: t.danger }}>Delete capture</Body></Pressable></> : <Empty title="Already organized" detail="This thought may have become a task or note. Find it from Today or its project." /> : <><Body secondary>An idea, a thing to do, something for later. Just save it—we can sort it out afterward.</Body><Field label="Your thought" value={text} onChange={setText} placeholder="What’s on your mind?" multiline autoFocus /><Body secondary style={{ fontSize: 13 }}>Saved to your inbox on this device. No project, date, or AI required.</Body><Action title={busy ? 'Saving…' : 'Save to inbox'} icon="arrow-down-outline" disabled={busy || !text.trim()} onPress={() => void save()} /></>}
    <ErrorMessage message={error} />
  </Screen></KeyboardAvoidingView>;
}
