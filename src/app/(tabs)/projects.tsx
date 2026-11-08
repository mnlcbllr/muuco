import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../../data/store';
import { Body, Card, Empty, Header, Icon, IconButton, IconTile, Screen, Segments } from '../../ui/components';
import { useTheme } from '../../ui/theme';

export default function Projects() {
  const t = useTheme();
  const store = useStore();
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const projects = store.projects.filter(project => Boolean(project.archived) === (filter === 'archived'));
  return <Screen>
    <Header title="Projects" right={<IconButton name="add" label="New project" onPress={() => router.push('/project-edit')} />} />
    <Segments value={filter} onChange={setFilter} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
    {projects.length ? <Card>{projects.map((project, index) => {
      const tasks = store.tasks.filter(task => task.projectId === project.id);
      const done = tasks.filter(task => task.status === 'done').length;
      const notes = store.notes.filter(note => note.projectId === project.id).length;
      return <Pressable key={project.id} accessibilityRole="button" accessibilityLabel={`${project.name}, ${done} of ${tasks.length} tasks completed`} onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderBottomWidth: index < projects.length - 1 ? 0.5 : 0, borderBottomColor: t.border, opacity: pressed ? 0.6 : 1 })}>
        <IconTile icon="folder" tone={project.color} size={40} />
        <View style={{ flex: 1, gap: 3 }}>
          <Body style={{ fontWeight: '600' }} numberOfLines={1}>{project.name}</Body>
          <Body secondary style={{ fontSize: 12.5 }}>{done} of {tasks.length} tasks · {notes} {notes === 1 ? 'note' : 'notes'}</Body>
        </View>
        <Icon name="chevron-forward" size={15} color={t.muted} />
      </Pressable>;
    })}</Card> : <Empty icon="albums-outline" title={filter === 'archived' ? 'Nothing archived' : 'No projects yet'} detail={filter === 'archived' ? 'Archived projects keep their tasks and notes.' : 'Start with a name. Add tasks and notes as you go.'} />}
  </Screen>;
}
