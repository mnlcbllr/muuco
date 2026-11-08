import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useStore } from '../../data/store';
import { Body, Card, Empty, FabMenu, Header, IconButton, Screen, Segments, s } from '../../ui/components';
import { NoteRow, TaskRow } from '../../ui/items';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const [tab, setTab] = useState<'tasks' | 'notes'>('tasks');
  const project = store.projects.find(project => project.id === id);
  if (!project) return <Screen><Header title="Project" back /><Empty title="Project not found" detail="Your other projects are still here." /></Screen>;
  const tasks = store.tasks.filter(task => task.projectId === id).sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
  const notes = store.notes.filter(note => note.projectId === id);
  const done = tasks.filter(task => task.status === 'done').length;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  return <Screen fabInset fab={<FabMenu items={[
    { icon: 'checkmark-circle-outline', label: 'Add a task', onPress: () => router.push({ pathname: '/edit', params: { kind: 'task', projectId: id } }) },
    { icon: 'document-text-outline', label: 'Add a note', onPress: () => router.push({ pathname: '/edit', params: { kind: 'note', projectId: id } }) },
  ]} />}>
    <Header eyebrow="Project" title={project.name} subtitle={project.archived ? 'Archived · your tasks and notes are preserved.' : 'One small step at a time.'} back right={<IconButton name="ellipsis-horizontal" label="Edit project" onPress={() => router.push({ pathname: '/project-edit', params: { id } })} />} />
    <Card style={{ padding: 16, gap: 10, backgroundColor: `${project.color}0D`, borderWidth: 1, borderColor: `${project.color}24` }}>
      <View style={s.between}><Body secondary style={{ fontSize: 13 }}>{done} of {tasks.length} tasks done</Body><Body style={{ fontSize: 14, fontWeight: '700', color: project.color }}>{percent}%</Body></View>
      <View style={{ height: 6, backgroundColor: `${project.color}22`, borderRadius: 3, overflow: 'hidden' }}><View style={{ height: 6, width: `${percent}%`, backgroundColor: project.color, borderRadius: 3 }} /></View>
    </Card>
    <Segments value={tab} onChange={setTab} options={[{ value: 'tasks', label: `Tasks · ${tasks.length}` }, { value: 'notes', label: `Notes · ${notes.length}` }]} />
    {tab === 'tasks' ? (tasks.length ? <Card>{tasks.map(task => <TaskRow key={task.id} task={task} />)}</Card> : <Empty icon="checkmark-circle-outline" title="No tasks yet" detail="Add the next small step. You can schedule it or leave it for later." />) : (notes.length ? <Card>{notes.map(note => <NoteRow key={note.id} note={note} />)}</Card> : <Empty icon="document-text-outline" title="No notes yet" detail="Keep project ideas and details alongside the work." />)}
  </Screen>;
}
