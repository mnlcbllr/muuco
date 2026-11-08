import { router, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { dateKey, dateFromKey, localInstant, statuses, statusLabels, suggestSlot, timeKey, validateTask, type TaskInput } from '../core/model';
import { useStore } from '../data/store';
import { requestReminders } from '../data/notifications';
import { Action, Body, Card, Empty, ErrorMessage, Field, Header, Icon, IconButton, Screen, Segments, s } from '../ui/components';
import DateField from '../ui/date-field';
import { confirm } from '../ui/confirm';
import { useEditorGuard } from '../ui/use-editor';
import { useTheme } from '../ui/theme';

export default function EditRoute() {
  const params = useLocalSearchParams<{ kind?: string; id?: string; projectId?: string; captureId?: string; day?: string }>();
  const kind = params.kind === 'note' || params.kind === 'event' ? params.kind : 'task';
  return <Editor key={`${kind}-${params.id}-${params.captureId}`} {...params} kind={kind} />;
}

function Editor({ kind, id, projectId, captureId, day }: { kind: 'task' | 'note' | 'event'; id?: string; projectId?: string; captureId?: string; day?: string }) {
  const t = useTheme(); const store = useStore();
  const [original] = useState(() => kind === 'task' ? store.tasks.find(item => item.id === id) : kind === 'note' ? store.notes.find(item => item.id === id) : store.events.find(item => item.id === id));
  const [capture] = useState(() => store.captures.find(item => item.id === captureId));
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
      title: original?.title ?? capture?.text.split('\n')[0].slice(0, 200) ?? '',
      body: task?.details ?? note?.body ?? capture?.text ?? '',
      project: task?.projectId ?? note?.projectId ?? projectId ?? null,
      status: task?.status ?? 'todo' as const,
      duration: String(task?.duration ?? event?.duration ?? 30),
      due: task?.dueDate ?? initialDay,
      hasDue: Boolean(task?.dueDate),
      schedule: Boolean(scheduled) || kind === 'event',
      scheduleDay: scheduled ? dateKey(new Date(scheduled)) : initialDay,
      scheduleTime: scheduled ? timeKey(new Date(scheduled)) : timeKey(nextHour),
      remind: Boolean(task?.remind),
    };
  });
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [saved, setSaved] = useState(false);
  const allowNavigation = useEditorGuard(!saved && JSON.stringify(draft) !== JSON.stringify(initial));
  const patch = (value: Partial<typeof draft>) => { setDraft(current => ({ ...current, ...value })); setError(''); setHint(''); };
  const missing = Boolean(id && !original) || Boolean(captureId && !capture);
  function leave() { allowNavigation(); if (router.canGoBack()) router.back(); else router.replace('/'); }
  function input(): TaskInput {
    return {
      title: draft.title, details: draft.body, projectId: draft.project,
      status: draft.status, dueDate: draft.hasDue ? draft.due : null,
      startAt: draft.schedule ? localInstant(draft.scheduleDay, draft.scheduleTime) : null,
      duration: Number(draft.duration), remind: draft.schedule && draft.remind ? 1 : 0,
    };
  }
  async function save() {
    if (busy) return; setBusy(true); setError('');
    try {
      if (kind === 'task') {
        const value = validateTask(input());
        await store.mutate(repo => repo.saveTask(recordId, value, task?.revision, captureId));
      } else if (kind === 'note') {
        await store.mutate(repo => repo.saveNote(recordId, draft.title, draft.body, draft.project, note?.revision, captureId));
      } else {
        const startAt = localInstant(draft.scheduleDay, draft.scheduleTime);
        await store.mutate(repo => repo.saveEvent(recordId, draft.title, startAt, Number(draft.duration), event?.revision));
      }
      setSaved(true); leave();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save. Your edits are still here.'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (busy || !id || !await confirm(`Delete this ${kind === 'event' ? 'commitment' : kind}?`, 'This removes it from this device. This cannot be undone.')) return;
    setBusy(true);
    try { await store.mutate(repo => repo.remove(kind, id)); setSaved(true); leave(); }
    catch { setError('Could not delete. Nothing has been reset.'); }
    finally { setBusy(false); }
  }
  function suggest() {
    try {
      const value = validateTask({ ...input(), title: draft.title.trim() || 'Task', startAt: null });
      const slot = suggestSlot(value, store.tasks, store.events, draft.scheduleDay, store.now, id);
      if (!slot) { setHint('No free slot fits between 9 am and 6 pm. Try another day or choose a time manually.'); return; }
      setDraft(current => ({ ...current, schedule: true, scheduleDay: dateKey(new Date(slot)), scheduleTime: timeKey(new Date(slot)) }));
      setHint('Available time found. Review it below, then save to confirm. Nothing else was moved.'); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Choose a valid duration first.'); }
  }
  async function enableReminder(value: boolean) {
    patch({ remind: value });
    if (value) {
      try { if (!await requestReminders()) setHint('Your task can still be saved. Allow notifications in device Settings to receive reminders.'); }
      catch { setHint('Your task can still be saved. Reminder permission could not be checked; retry from Settings.'); }
    }
  }
  if (missing) return <Screen><Header title="Not found" back /><Empty title="This item is no longer here" detail="It may have been deleted or the capture may already have been organized. Your other information has not changed." /></Screen>;
  const title = `${original ? 'Edit' : 'New'} ${kind === 'event' ? 'commitment' : kind}`;
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><Screen>
    <Header title={title} back right={<IconButton name="close" label="Close editor" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />} />
    <Field label={kind === 'note' ? 'Title' : 'Name'} value={draft.title} onChange={title => patch({ title })} placeholder={kind === 'task' ? 'What’s your next small step?' : kind === 'note' ? 'Give your thought a title' : 'Class, meeting, or something else'} />
    {kind !== 'event' && <>
      <Field label={kind === 'note' ? 'Your note' : 'Details'} value={draft.body} onChange={body => patch({ body })} placeholder={kind === 'note' ? 'A little space to think…' : 'Anything you’ll want to remember…'} multiline />
      <View style={{ gap: 10 }}><Body secondary style={{ fontSize: 13, fontWeight: '600' }}>Project</Body><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[{ id: null, name: 'No project', color: t.secondary }, ...store.projects.filter(project => !project.archived || project.id === draft.project)].map(project => <Pressable key={project.id ?? 'none'} accessibilityRole="button" accessibilityState={{ selected: draft.project === project.id }} onPress={() => patch({ project: project.id })} style={{ minHeight: 46, borderWidth: 1, borderColor: draft.project === project.id ? t.accent : t.border, backgroundColor: draft.project === project.id ? t.accentSoft : t.surface, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: project.color }} /><Body style={{ color: draft.project === project.id ? t.accentText : t.text, fontSize: 14 }}>{project.name}</Body></Pressable>)}
      </ScrollView></View>
    </>}
    {kind === 'task' && <>
      <View style={{ gap: 10 }}><Body secondary style={{ fontSize: 13, fontWeight: '600' }}>Status</Body><Segments value={draft.status} onChange={status => patch({ status })} options={statuses.map(value => ({ value, label: statusLabels[value] }))} /></View>
      <Card style={{ padding: 17, gap: 10 }}><View style={s.between}><View style={s.row}><Icon name="flag-outline" color={t.accent} /><Body>Deadline</Body></View><Switch accessibilityLabel="Set a deadline" value={draft.hasDue} onValueChange={hasDue => patch({ hasDue })} trackColor={{ true: t.accent }} /></View><Body secondary style={{ fontSize: 13 }}>When it needs to be finished—not when you’ll work on it.</Body></Card>
      {draft.hasDue && <DateField label="Due date" value={draft.due} mode="date" onChange={due => patch({ due })} />}
      <Card style={{ padding: 17, gap: 10 }}><View style={s.between}><View style={s.row}><Icon name="time-outline" color={t.accent} /><Body>Make time for it</Body></View><Switch accessibilityLabel="Schedule a work session" value={draft.schedule} onValueChange={schedule => patch({ schedule })} trackColor={{ true: t.accent }} /></View><Body secondary style={{ fontSize: 13 }}>Give this task a place on your calendar.</Body></Card>
    </>}
    {(kind === 'task' || kind === 'event') && <Field label={kind === 'task' ? 'Estimated minutes' : 'Duration in minutes'} value={draft.duration} onChange={duration => patch({ duration })} placeholder="30" numeric />}
    {(kind === 'event' || (kind === 'task' && draft.schedule)) && <>
      <DateField label="Scheduled day" value={draft.scheduleDay} mode="date" onChange={scheduleDay => patch({ scheduleDay })} />
      <DateField label="Start time" value={draft.scheduleTime} mode="time" onChange={scheduleTime => patch({ scheduleTime })} />
      <Body secondary style={{ fontSize: 12 }}>Times use your device’s time zone. Existing timed sessions keep their original instant if you travel.</Body>
      {kind === 'task' && <><Action secondary icon="sparkles-outline" title="Find a free slot · 9 am–6 pm" onPress={suggest} /><Body secondary style={{ fontSize: 12 }}>A local availability check, not AI. It never moves your existing plans.</Body>
        <Card style={{ padding: 17, gap: 10 }}><View style={s.between}><Body>Remind me at the start</Body><Switch accessibilityLabel="Remind me at the start" disabled={Platform.OS === 'web'} value={draft.remind} onValueChange={value => void enableReminder(value)} trackColor={{ true: t.accent }} /></View><Body secondary style={{ fontSize: 13 }}>{Platform.OS === 'web' ? 'Reminders require the Android or iOS build.' : 'A local notification with private, generic text. Delivery depends on device settings.'}</Body></Card>
      </>}
      {kind === 'task' && draft.hasDue && draft.scheduleDay > draft.due && <Body style={{ color: t.danger, fontSize: 14 }}>This session is after the deadline. Saving the session will not move the deadline.</Body>}
    </>}
    {!!hint && <Body accessibilityLiveRegion="polite" secondary style={{ fontSize: 14 }}>{hint}</Body>}
    <ErrorMessage message={error} />
    <Action title={busy ? 'Saving…' : original ? 'Save changes' : kind === 'note' ? 'Save note' : kind === 'event' ? 'Add commitment' : 'Add task'} disabled={busy} onPress={() => void save()} />
    {original && <Pressable accessibilityRole="button" disabled={busy} onPress={() => void remove()} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center' }}><Body style={{ color: t.danger }}>Delete {kind === 'event' ? 'commitment' : kind}</Body></Pressable>}
  </Screen></KeyboardAvoidingView>;
}
