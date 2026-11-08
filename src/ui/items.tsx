import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { dateKey, formatDay, formatTime, type Event, type Note, type Task } from '../core/model';
import { useStore } from '../data/store';
import { Body, ErrorMessage, Icon, s } from './components';
import { useTheme } from './theme';

export function TaskRow({ task, compact = false }: { task: Task; compact?: boolean }) {
  const t = useTheme();
  const store = useStore();
  const project = store.projects.find(p => p.id === task.projectId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const done = task.status === 'done';
  const overdue = task.dueDate && task.dueDate < dateKey(store.now) && !done;
  async function toggle() {
    if (busy) return;
    setBusy(true); setError('');
    try { await store.mutate(repo => repo.saveTask(task.id, { ...task, status: done ? 'todo' : 'done' }, task.revision)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update this task.'); }
    finally { setBusy(false); }
  }
  return <View style={{ paddingVertical: compact ? 7 : 10, paddingRight: 15, borderBottomWidth: 0.5, borderBottomColor: t.border }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={`${done ? 'Reopen' : 'Complete'} ${task.title}`} accessibilityState={{ checked: done, disabled: busy }} disabled={busy} onPress={() => void toggle()} style={{ width: 51, minHeight: 51, alignItems: 'center', justifyContent: 'center' }}><Icon name={done ? 'checkmark-circle' : task.status === 'in_progress' ? 'radio-button-on-outline' : 'ellipse-outline'} size={25} color={done ? t.success : task.status === 'in_progress' ? t.accent : t.secondary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={() => router.push({ pathname: '/edit', params: { kind: 'task', id: task.id } })} style={{ flex: 1, minHeight: 51, justifyContent: 'center', gap: 5, paddingVertical: 3 }}>
        <Body style={{ fontSize: 16, textDecorationLine: done ? 'line-through' : 'none', color: done ? t.secondary : t.text }}>{task.title}</Body>
        {(project || task.dueDate || task.startAt) && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {project && <View style={[s.row, { gap: 5 }]}><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: project.color }} /><Body secondary style={{ fontSize: 12, lineHeight: 18 }}>{project.name}</Body></View>}
          {task.startAt && <Body secondary style={{ fontSize: 12, lineHeight: 18 }}>{dateKey(new Date(task.startAt)) !== dateKey(store.now) ? `${formatDay(dateKey(new Date(task.startAt)))} · ` : ''}{formatTime(task.startAt)} · {task.duration}m</Body>}
          {task.dueDate && <Body style={{ fontSize: 12, lineHeight: 18, color: overdue ? t.danger : t.secondary }}>{overdue ? 'Overdue · ' : 'Due '}{formatDay(task.dueDate)}</Body>}
        </View>}
      </Pressable>
      <Icon name="chevron-forward" size={15} />
    </View>
    {!!error && <View style={{ paddingLeft: 16 }}><ErrorMessage message={error} /></View>}
  </View>;
}
export function NoteRow({ note }: { note: Note }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open note ${note.title}`} onPress={() => router.push({ pathname: '/edit', params: { kind: 'note', id: note.id } })} style={{ padding: 17, gap: 7, borderBottomWidth: 0.5, borderBottomColor: t.border }}><View style={s.between}><View style={[s.row, { flex: 1 }]}><Icon name="document-text-outline" size={20} color={t.accent} /><Body style={{ fontWeight: '500', flex: 1 }}>{note.title}</Body></View><Icon name="chevron-forward" size={15} /></View>{!!note.body && <Body secondary numberOfLines={2} style={{ fontSize: 14 }}>{note.body}</Body>}</Pressable>;
}
export function EventRow({ event }: { event: Event }) {
  const t = useTheme();
  const end = new Date(Date.parse(event.startAt) + event.duration * 60000).toISOString();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit commitment ${event.title}`} onPress={() => router.push({ pathname: '/edit', params: { kind: 'event', id: event.id } })} style={{ padding: 18, gap: 7, borderBottomWidth: 0.5, borderBottomColor: t.border }}>
    <View style={s.between}><View style={[s.row, { flex: 1 }]}><Icon name="lock-closed-outline" color={t.secondary} size={18} /><Body style={{ flex: 1, fontWeight: '600' }}>{event.title}</Body></View><Icon name="chevron-forward" size={15} /></View>
    <Body secondary style={{ fontSize: 12 }}>{formatDay(dateKey(new Date(event.startAt)))} · {formatTime(event.startAt)} – {dateKey(new Date(end)) !== dateKey(new Date(event.startAt)) ? `${formatDay(dateKey(new Date(end)))} · ` : ''}{formatTime(end)}</Body>
  </Pressable>;
}
