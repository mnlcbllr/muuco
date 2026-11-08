import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { dateKey, occursOnDay } from '../../core/model';
import { useStore } from '../../data/store';
import { Action, Body, Card, Empty, Header, Icon, IconButton, Owl, Screen, Search, Section, s } from '../../ui/components';
import { EventRow, NoteRow, TaskRow } from '../../ui/items';
import { useTheme } from '../../ui/theme';

export default function Today() {
  const t = useTheme();
  const store = useStore();
  const [query, setQuery] = useState('');
  const today = dateKey(store.now);
  const active = store.tasks.filter(task => task.status !== 'done');
  const planned = active.filter(task => task.startAt && occursOnDay(task.startAt, task.duration, today)).sort((a, b) => a.startAt!.localeCompare(b.startAt!));
  const commitments = store.events.filter(event => occursOnDay(event.startAt, event.duration, today));
  const attention = active.filter(task => task.dueDate && task.dueDate <= today && !planned.some(p => p.id === task.id));
  const anytime = active.filter(task => !planned.some(p => p.id === task.id) && !attention.some(p => p.id === task.id));
  const q = query.trim().toLocaleLowerCase();
  const foundTasks = store.tasks.filter(task => `${task.title} ${task.details}`.toLocaleLowerCase().includes(q));
  const foundNotes = store.notes.filter(note => `${note.title} ${note.body}`.toLocaleLowerCase().includes(q));
  const foundProjects = store.projects.filter(project => project.name.toLocaleLowerCase().includes(q));
  const foundCaptures = store.captures.filter(capture => capture.text.toLocaleLowerCase().includes(q));
  const date = store.now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return <Screen>
    <Header title="Today" subtitle={date} />
    <Search value={query} onChange={setQuery} />
    {!!store.notice && <Card style={{ padding: 18, backgroundColor: t.goldSoft }}><Body accessibilityRole="alert" style={{ fontSize: 14 }}>{store.notice}</Body></Card>}
    {q ? <>
      <Section title="Search results" count={foundTasks.length + foundNotes.length + foundProjects.length + foundCaptures.length}>
        {!foundTasks.length && !foundNotes.length && !foundProjects.length && !foundCaptures.length && <Empty icon="search-outline" title="Nothing here just yet" detail="Try a different word from a task, note, project, or captured thought." />}
        {!!foundTasks.length && <Card>{foundTasks.map(task => <TaskRow key={task.id} task={task} />)}</Card>}
        {!!foundNotes.length && <Card>{foundNotes.map(note => <NoteRow key={note.id} note={note} />)}</Card>}
        {!!foundProjects.length && <Card>{foundProjects.map(project => <Pressable key={project.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })} style={{ padding: 18 }}><Body>{project.name}{project.archived ? ' · Archived' : ''}</Body></Pressable>)}</Card>}
        {!!foundCaptures.length && <Card>{foundCaptures.map(capture => <Pressable key={capture.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/capture', params: { id: capture.id } })} style={{ padding: 18 }}><Body numberOfLines={3}>{capture.text}</Body></Pressable>)}</Card>}
      </Section>
    </> : <>
      <View style={{ backgroundColor: t.accentSoft, borderRadius: 24, padding: 22, gap: 18 }}>
        <View style={[s.row, { alignItems: 'flex-start', gap: 18 }]}><View style={{ flex: 1, gap: 9 }}><Body style={{ color: t.accentText, fontSize: 11, fontWeight: '700', letterSpacing: 1.8 }}>A LITTLE LESS TO REMEMBER</Body><Body style={{ fontSize: 23, lineHeight: 30, fontWeight: '600', letterSpacing: -0.5 }}>Make space for{ '\n' }what matters.</Body><Body secondary style={{ fontSize: 14, lineHeight: 21 }}>Get it out of your head. We’ll take it one thing at a time.</Body></View><Owl size={76} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Capture a thought" onPress={() => router.push('/capture')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: t.surface, padding: 14, minHeight: 50 }}><Icon name="add-circle-outline" color={t.accent} /><Body secondary style={{ flex: 1, fontSize: 15 }}>What’s on your mind?</Body><Icon name="arrow-up-outline" size={18} color={t.accent} /></Pressable>
      </View>
      {store.reminders.state === 'error' && <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={{ backgroundColor: t.goldSoft, padding: 16, borderRadius: 14 }}><Body style={{ fontSize: 14 }}>{store.reminders.message}</Body></Pressable>}
      {!!commitments.length && <Section title="Your commitments" count={commitments.length}><Card>{commitments.map(event => <EventRow key={event.id} event={event} />)}</Card></Section>}
      <Section title="Planned today" count={planned.length} action="Calendar" onAction={() => router.push('/calendar')}>
        {planned.length ? <Card>{planned.map(task => <TaskRow key={task.id} task={task} />)}</Card> : <Empty icon="sunny-outline" title="A little breathing room" detail="No tasks are time-blocked today. Pick one and give it a place in your day." action="Plan your day" onAction={() => router.push('/calendar')} />}
      </Section>
      {!!attention.length && <Section title="Needs attention" count={attention.length}><Card>{attention.map(task => <TaskRow key={task.id} task={task} />)}</Card></Section>}
      <Section title="Inbox" count={store.captures.length} action="Capture" onAction={() => router.push('/capture')}>
        {store.captures.length ? <Card>{store.captures.map(capture => <Pressable key={capture.id} accessibilityRole="button" accessibilityLabel={`Organize ${capture.text}`} onPress={() => router.push({ pathname: '/capture', params: { id: capture.id } })} style={{ flexDirection: 'row', gap: 13, alignItems: 'center', padding: 17, borderBottomColor: t.border, borderBottomWidth: 0.5 }}><Icon name="file-tray-outline" color={t.accent} /><View style={{ flex: 1, gap: 4 }}><Body numberOfLines={2}>{capture.text}</Body><Body secondary style={{ fontSize: 12 }}>Captured · ready when you are</Body></View><Icon name="chevron-forward" size={15} /></Pressable>)}</Card> : <Empty icon="file-tray-outline" title="A home for loose thoughts" detail="Ideas, things to remember, something for later. Capture now and organize when you’re ready." />}
      </Section>
      <Section title="On your list" count={anytime.length} action="New task" onAction={() => router.push({ pathname: '/edit', params: { kind: 'task' } })}>
        {anytime.length ? <Card>{anytime.map(task => <TaskRow key={task.id} task={task} />)}</Card> : <View style={{ gap: 14 }}><Body secondary style={{ fontSize: 14 }}>Your next small step can start here.</Body><Action title="Add a task" icon="add" secondary onPress={() => router.push({ pathname: '/edit', params: { kind: 'task' } })} /></View>}
      </Section>
      <Section title="Notes" count={store.notes.length} action="New note" onAction={() => router.push({ pathname: '/edit', params: { kind: 'note' } })}>
        {store.notes.length ? <Card>{store.notes.map(note => <NoteRow key={note.id} note={note} />)}</Card> : <Body secondary style={{ fontSize: 14 }}>Keep the details you don’t want to carry in your head.</Body>}
      </Section>
      <View style={[s.between, { paddingTop: 8 }]}><View style={[s.row, { gap: 7 }]}><Icon name="phone-portrait-outline" size={14} /><Body secondary style={{ fontSize: 12 }}>{Platform.OS === 'web' ? 'Browser preview · unencrypted' : 'Saved on this device · works offline'}</Body></View><IconButton name="settings-outline" label="Settings and privacy" onPress={() => router.push('/settings')} /></View>
    </>}
  </Screen>;
}
