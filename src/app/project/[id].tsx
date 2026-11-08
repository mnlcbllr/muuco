import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { statusLabels, statuses } from '../../core/model';
import { useStore } from '../../data/store';
import { Action, Body, Card, Empty, Header, IconButton, Screen, Segments, s } from '../../ui/components';
import { NoteRow, TaskRow } from '../../ui/items';
import { useTheme } from '../../ui/theme';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme(); const store = useStore(); const { width } = useWindowDimensions();
  const [tab, setTab] = useState<'tasks' | 'notes'>('tasks');
  const project = store.projects.find(project => project.id === id);
  if (!project) return <Screen><Header title="Project" back /><Empty title="Project not found" detail="Your other projects are still here." /></Screen>;
  const tasks = store.tasks.filter(task => task.projectId === id);
  const notes = store.notes.filter(note => note.projectId === id);
  const done = tasks.filter(task => task.status === 'done').length;
  const columnWidth = Math.min(width - 60, 310);
  return <Screen><Header title={project.name} subtitle={project.archived ? 'Archived · your tasks and notes are preserved.' : 'One small step at a time.'} back right={<IconButton name="ellipsis-horizontal" label="Edit project" onPress={() => router.push({ pathname: '/project-edit', params: { id } })} />} />
    <Card style={{ padding: 18, gap: 12 }}><View style={s.between}><Body secondary style={{ fontSize: 14 }}>Your progress</Body><Body style={{ fontSize: 14, fontWeight: '500' }}>{done} of {tasks.length} tasks completed</Body></View><View style={{ height: 6, backgroundColor: t.inset, borderRadius: 3, overflow: 'hidden' }}><View style={{ height: 6, width: `${tasks.length ? done / tasks.length * 100 : 0}%`, backgroundColor: project.color }} /></View></Card>
    <Segments value={tab} onChange={setTab} options={[{ value: 'tasks', label: `Tasks · ${tasks.length}` }, { value: 'notes', label: `Notes · ${notes.length}` }]} />
    {tab === 'tasks' ? <>
      <Body secondary style={{ fontSize: 13 }}>Swipe through your board. Open a task to move it to another column.</Body>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={columnWidth + 14} decelerationRate="fast" contentContainerStyle={{ gap: 14, paddingBottom: 4 }}>
        {statuses.map(status => {
          const items = tasks.filter(task => task.status === status);
          return <View key={status} style={{ width: columnWidth, backgroundColor: t.inset, borderRadius: 20, padding: 10, gap: 12, alignSelf: 'flex-start', minHeight: 240 }}><View style={[s.between, { paddingHorizontal: 6, paddingTop: 7 }]}><View style={[s.row, { gap: 7 }]}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: status === 'done' ? t.success : status === 'in_progress' ? t.gold : project.color }} /><Body style={{ fontSize: 14, fontWeight: '600' }}>{statusLabels[status]}</Body></View><Body secondary style={{ fontSize: 13 }}>{items.length}</Body></View>{items.length ? items.map(task => <Card key={task.id}><TaskRow compact task={task} /></Card>) : <View style={{ padding: 15, gap: 7 }}><Body secondary style={{ fontSize: 14 }}>A little room for progress.</Body><Body secondary style={{ fontSize: 12 }}>{status === 'done' ? 'Finished tasks will land here.' : 'Tasks in this stage will appear here.'}</Body></View>}</View>;
        })}
      </ScrollView><Action title="Add a task" icon="add" onPress={() => router.push({ pathname: '/edit', params: { kind: 'task', projectId: id } })} />
    </> : <>{notes.length ? <Card>{notes.map(note => <NoteRow key={note.id} note={note} />)}</Card> : <Empty icon="document-text-outline" title="Keep the thinking here" detail="Project ideas, meeting notes, useful details. Right alongside the work they belong to." />}<Action title="Add a note" icon="add" onPress={() => router.push({ pathname: '/edit', params: { kind: 'note', projectId: id } })} /></>}
  </Screen>;
}
