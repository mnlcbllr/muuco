import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../../data/store';
import { Action, Body, Card, Empty, Header, Icon, Screen, Search, Segments, s } from '../../ui/components';
import { useTheme } from '../../ui/theme';

export default function Projects() {
  const t = useTheme(); const store = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const projects = store.projects.filter(project => Boolean(project.archived) === (filter === 'archived') && project.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <Screen><Header title="Projects" subtitle="The things you’re moving forward." /><Search value={query} onChange={setQuery} placeholder="Find a project" /><Segments value={filter} onChange={setFilter} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
    {projects.length ? <View style={{ gap: 14 }}>{projects.map(project => {
      const tasks = store.tasks.filter(task => task.projectId === project.id);
      const done = tasks.filter(task => task.status === 'done').length;
      const notes = store.notes.filter(note => note.projectId === project.id).length;
      return <Pressable key={project.id} accessibilityRole="button" accessibilityLabel={`${project.name}, ${done} of ${tasks.length} tasks completed`} onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}><Card style={{ padding: 20, gap: 18 }}><View style={s.between}><View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: t.inset }}><Icon name="folder-outline" color={project.color} /></View><Icon name="chevron-forward" size={18} /></View><Body style={{ fontSize: 21, fontWeight: '600', letterSpacing: -0.4 }}>{project.name}</Body><View style={{ gap: 10 }}><View style={{ height: 5, backgroundColor: t.inset, borderRadius: 3, overflow: 'hidden' }}><View style={{ width: `${tasks.length ? done / tasks.length * 100 : 0}%`, height: 5, backgroundColor: project.color }} /></View><Body secondary style={{ fontSize: 13 }}>{done} of {tasks.length} tasks completed · {notes} {notes === 1 ? 'note' : 'notes'}</Body></View></Card></Pressable>;
    })}</View> : <Empty icon="albums-outline" title={query ? 'No matching projects' : filter === 'archived' ? 'Nothing archived' : 'Give your work a home'} detail={filter === 'archived' ? 'Archived projects keep their tasks and notes. You can bring them back anytime.' : 'School, personal ideas, client work. Start with a name and keep the related tasks and notes together.'} />}
    <Action title="New project" icon="add" onPress={() => router.push('/project-edit')} />
  </Screen>;
}
