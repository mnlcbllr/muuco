import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { dateKey, formatDay, formatTime, type Event, type Note, type Task } from '../core/model';
import { useStore } from '../data/store';
import { Body, ErrorMessage, Icon, IconTile, s } from './components';
import { useTheme } from './theme';

export function TaskRow({ task, compact = false }: { task: Task; compact?: boolean }) {
  const t = useTheme();
  const store = useStore();
  const project = store.projects.find(p => p.id === task.projectId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const done = task.status === 'done';
  const overdue = Boolean(task.dueDate && task.dueDate < dateKey(store.now) && !done);
  async function toggle() {
    if (busy) return;
    setBusy(true); setError('');
    try { await store.mutate(repo => repo.saveTask(task.id, { ...task, status: done ? 'todo' : 'done' }, task.revision)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update this task.'); }
    finally { setBusy(false); }
  }
  return <View style={{ paddingVertical: compact ? 4 : 7, paddingLeft: compact ? 8 : 10, paddingRight: compact ? 8 : 12, borderBottomWidth: 0.5, borderBottomColor: t.border }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={`${done ? 'Reopen' : 'Complete'} ${task.title}`} accessibilityState={{ checked: done, disabled: busy }} disabled={busy} onPress={() => void toggle()} style={{ width: compact ? 38 : 44, minHeight: compact ? 38 : 48, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.5 : 1 }}>
        <Icon name={done ? 'checkmark-circle' : task.status === 'in_progress' ? 'radio-button-on' : 'ellipse-outline'} size={compact ? 22 : 25} color={done ? t.success : task.status === 'in_progress' ? t.accent : t.muted} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={() => router.push({ pathname: '/edit', params: { kind: 'task', id: task.id } })} style={{ flex: 1, minHeight: compact ? 42 : 50, justifyContent: 'center', gap: 5, paddingVertical: 3 }}>
        <Body style={{ fontSize: compact ? 14.5 : 15.5, fontWeight: '600', textDecorationLine: done ? 'line-through' : 'none', color: done ? t.muted : t.text }}>{task.title}</Body>
        {(project || task.dueDate || task.startAt) && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {project && <View style={[s.row, { gap: 5 }]}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: project.color }} /><Body secondary style={{ fontSize: 11.5, lineHeight: 16 }}>{project.name}</Body></View>}
          {task.startAt && <View style={{ borderRadius: 8, backgroundColor: t.accentTint, paddingHorizontal: 7, minHeight: 21, justifyContent: 'center' }}><Body style={{ fontSize: 11.5, lineHeight: 16, color: t.accent, fontWeight: '600' }}>{dateKey(new Date(task.startAt)) !== dateKey(store.now) ? `${formatDay(dateKey(new Date(task.startAt)))} · ` : ''}{formatTime(task.startAt)}</Body></View>}
          {task.dueDate && <View style={{ borderRadius: 8, backgroundColor: overdue ? t.dangerSoft : t.surfaceTint, paddingHorizontal: 7, minHeight: 21, justifyContent: 'center' }}><Body style={{ fontSize: 11.5, lineHeight: 16, color: overdue ? t.danger : t.secondary, fontWeight: '600' }}>{overdue ? 'Overdue · ' : 'Due '}{formatDay(task.dueDate)}</Body></View>}
        </View>}
      </Pressable>
      <Icon name="chevron-forward" size={14} color={t.muted} />
    </View>
    {!!error && <View style={{ paddingLeft: 14 }}><ErrorMessage message={error} /></View>}
  </View>;
}

export function NoteRow({ note }: { note: Note }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open note ${note.title}`} onPress={() => router.push({ pathname: '/edit', params: { kind: 'note', id: note.id } })} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderBottomWidth: 0.5, borderBottomColor: t.border, opacity: pressed ? 0.6 : 1 })}>
    <IconTile icon="document-text-outline" tone={t.accent} size={40} />
    <View style={{ flex: 1, gap: 3 }}><Body style={{ fontWeight: '600' }} numberOfLines={1}>{note.title}</Body>{!!note.body && <Body secondary numberOfLines={2} style={{ fontSize: 13, lineHeight: 18 }}>{note.body}</Body>}</View>
    <Icon name="chevron-forward" size={14} color={t.muted} />
  </Pressable>;
}

export function EventRow({ event }: { event: Event }) {
  const t = useTheme();
  const end = new Date(Date.parse(event.startAt) + event.duration * 60000).toISOString();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit event ${event.title}`} onPress={() => router.push({ pathname: '/edit', params: { kind: 'event', id: event.id } })} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderBottomWidth: 0.5, borderBottomColor: t.border, opacity: pressed ? 0.6 : 1 })}>
    <IconTile icon="lock-closed-outline" tone={t.gold} size={40} />
    <View style={{ flex: 1, gap: 3 }}>
      <Body style={{ flexShrink: 1, fontWeight: '600' }} numberOfLines={1}>{event.title}</Body>
      <Body secondary style={{ fontSize: 12, lineHeight: 17 }}>{formatTime(event.startAt)} – {formatTime(end)}{dateKey(new Date(end)) !== dateKey(new Date(event.startAt)) ? ` · spans to ${formatDay(dateKey(new Date(end)))}` : ''}</Body>
    </View>
    <Icon name="chevron-forward" size={14} color={t.muted} />
  </Pressable>;
}
