import { router, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { dateKey, dateFromKey, localInstant, timeKey, validateTask, type TaskInput } from '../core/model';
import { useStore } from '../data/store';
import { Action, Body, Card, Chip, Empty, ErrorMessage, Eyebrow, Field, Header, IconButton, Screen, Segments, s } from '../ui/components';
import DateField from '../ui/date-field';
import { confirm } from '../ui/confirm';
import { useEditorGuard } from '../ui/use-editor';
import { useTheme } from '../ui/theme';

type When = 'none' | 'due' | 'scheduled';

export default function EditRoute() {
  const params = useLocalSearchParams<{ kind?: string; id?: string; projectId?: string; day?: string }>();
  const kind = params.kind === 'note' || params.kind === 'event' ? params.kind : 'task';
  return <Editor key={`${kind}-${params.id}`} {...params} kind={kind} />;
}

function Editor({ kind, id, projectId, day }: { kind: 'task' | 'note' | 'event'; id?: string; projectId?: string; day?: string }) {
  const t = useTheme(); const store = useStore();
  const [original] = useState(() => kind === 'task' ? store.tasks.find(item => item.id === id) : kind === 'note' ? store.notes.find(item => item.id === id) : store.events.find(item => item.id === id));
  const [recordId] = useState(() => id ?? randomUUID());
  const task = original && 'status' in original ? original : undefined;
  const note = original && 'body' in original ? original : undefined;
  const event = original && !('status' in original) && !('body' in original) ? original : undefined;
  const [initial] = useState(() => {
    let initialDay = day ?? dateKey(store.now);
    try { dateFromKey(initialDay); } catch { initialDay = dateKey(store.now); }
    const scheduled = task?.startAt ?? event?.startAt;
    const nextHour = new Date(store.now); nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return {
      title: original?.title ?? '',
      body: task?.details ?? note?.body ?? '',
      project: task?.projectId ?? note?.projectId ?? projectId ?? null,
      status: task?.status ?? 'todo' as const,
      duration: String(task?.duration ?? event?.duration ?? (kind === 'event' ? 60 : 30)),
      due: task?.dueDate ?? initialDay,
      scheduleDay: scheduled ? dateKey(new Date(scheduled)) : initialDay,
      scheduleTime: scheduled ? timeKey(new Date(scheduled)) : timeKey(nextHour),
      remind: task?.remind ?? 0,
    };
  });
  const [initialWhen] = useState<When>(() => kind === 'event' || task?.startAt ? 'scheduled' : task?.dueDate ? 'due' : day ? 'scheduled' : 'none');
  const [when, setWhen] = useState<When>(initialWhen);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial) || when !== initialWhen;
  const allowNavigation = useEditorGuard(!saved && dirty);
  const patch = (value: Partial<typeof draft>) => { setDraft(current => ({ ...current, ...value })); setError(''); };
  const missing = Boolean(id && !original);
  const projects = store.projects.filter(project => !project.archived || project.id === draft.project);
  const durationValue = Number(draft.duration);
  const durationOptions = [15, 30, 45, 60, 90, 120];
  const durations = (durationOptions.includes(durationValue) ? durationOptions : [...durationOptions, durationValue]).sort((a, b) => a - b);
  function leave() { allowNavigation(); if (router.canGoBack()) router.back(); else router.replace('/'); }
  function input(): TaskInput {
    const dueDate = when === 'due' ? draft.due : when === 'scheduled' && initialWhen === 'scheduled' ? task?.dueDate ?? null : null;
    return {
      title: draft.title, details: draft.body, projectId: draft.project,
      status: draft.status, dueDate,
      startAt: when === 'scheduled' ? localInstant(draft.scheduleDay, draft.scheduleTime) : null,
      duration: Number(draft.duration), remind: draft.remind,
    };
  }
  async function save() {
    if (busy) return; setBusy(true); setError('');
    try {
      if (kind === 'task') {
        const value = validateTask(input());
        await store.mutate(repo => repo.saveTask(recordId, value, task?.revision));
      } else if (kind === 'note') {
        await store.mutate(repo => repo.saveNote(recordId, draft.title, draft.body, draft.project, note?.revision));
      } else {
        const startAt = localInstant(draft.scheduleDay, draft.scheduleTime);
        await store.mutate(repo => repo.saveEvent(recordId, draft.title, startAt, Number(draft.duration), event?.revision));
      }
      setSaved(true); leave();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save. Your edits are still here.'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (busy || !id || !await confirm(`Delete this ${kind === 'event' ? 'event' : kind}?`, 'This cannot be undone.')) return;
    setBusy(true);
    try { await store.mutate(repo => repo.remove(kind, id)); setSaved(true); leave(); }
    catch { setError('Could not delete. Nothing has been reset.'); }
    finally { setBusy(false); }
  }
  if (missing) return <Screen><Header title="Not found" back /><Empty title="This item is no longer here" detail="It may have been deleted or already organized." /></Screen>;
  const title = `${original ? 'Edit' : 'New'} ${kind === 'note' ? 'note' : kind === 'event' ? 'event' : 'task'}`;
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><Screen
    footer={<>
      <ErrorMessage message={error} />
      <View style={s.row}>
        {original && <Pressable accessibilityRole="button" disabled={busy} onPress={() => void remove()} style={{ minHeight: 54, justifyContent: 'center', paddingHorizontal: 10 }}><Body style={{ color: t.danger, fontSize: 15, fontWeight: '700' }}>Delete</Body></Pressable>}
        <View style={{ flex: 1 }}><Action title={busy ? 'Saving…' : original ? 'Save changes' : kind === 'note' ? 'Save note' : kind === 'event' ? 'Add event' : 'Add task'} disabled={busy} onPress={() => void save()} /></View>
      </View>
    </>}
  >
    <Header eyebrow={kind === 'note' ? 'Note' : kind === 'event' ? 'Event' : 'Task'} title={title} right={<IconButton name="close" label="Close editor" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />} />
    <Card style={{ padding: 16, gap: 15 }}>
      <Field label={kind === 'note' ? 'Title' : 'Name'} value={draft.title} onChange={title => patch({ title })} placeholder={kind === 'task' ? 'What needs doing?' : kind === 'note' ? 'Title' : 'What is it?'} />
      {kind !== 'event' && <Field label={kind === 'note' ? 'Your note' : 'Details'} value={draft.body} onChange={body => patch({ body })} placeholder={kind === 'note' ? 'Write it down…' : 'Add details (optional)'} multiline compact={kind === 'task'} />}
    </Card>
    {kind !== 'event' && !!projects.length && <View style={{ gap: 9 }}>
      <Eyebrow>Project</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[{ id: null, name: 'None', color: t.muted }, ...projects].map(project => <Chip key={project.id ?? 'none'} label={project.name} selected={draft.project === project.id} dot={project.color} onPress={() => patch({ project: project.id })} />)}
      </ScrollView>
    </View>}
    {kind !== 'note' && <Card style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
      {kind === 'task' ? <View style={{ paddingTop: 14, gap: 10 }}>
        <Body style={{ fontWeight: '700', fontSize: 16 }}>When</Body>
        <Segments value={when} onChange={setWhen} options={[
          { value: 'none', label: 'No date' },
          { value: 'due', label: 'Due date' },
          { value: 'scheduled', label: 'Time block' },
        ]} />
      </View> : <View style={{ paddingTop: 14 }}><Body style={{ fontWeight: '700', fontSize: 16 }}>When</Body></View>}
      <View style={{ paddingTop: 14, gap: 13 }}>
        {when === 'due' && <DateField label="Due date" value={draft.due} mode="date" onChange={due => patch({ due })} />}
        {when === 'scheduled' && <>
          <DateField label="Day" value={draft.scheduleDay} mode="date" onChange={scheduleDay => patch({ scheduleDay })} />
          <DateField label="Start time" value={draft.scheduleTime} mode="time" onChange={scheduleTime => patch({ scheduleTime })} />
          <View style={{ gap: 9 }}>
            <Body secondary style={{ fontSize: 13, fontWeight: '700' }}>How long?</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {durations.map(minutes => <Chip key={minutes} label={`${minutes} min`} selected={durationValue === minutes} onPress={() => patch({ duration: String(minutes) })} />)}
            </View>
          </View>
        </>}
        {when === 'none' && <Body secondary style={{ fontSize: 13 }}>No date. It will sit in Anytime.</Body>}
      </View>
    </Card>}
  </Screen></KeyboardAvoidingView>;
}
