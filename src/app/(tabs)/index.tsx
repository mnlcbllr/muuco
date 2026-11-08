import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import { dateKey, occursOnDay } from '../../core/model';
import { useStore } from '../../data/store';
import { Body, Card, Empty, ErrorMessage, Header, Icon, IconButton, IconTile, Owl, Screen, Search, Section } from '../../ui/components';
import { EventRow, NoteRow, TaskRow } from '../../ui/items';
import { pickMood, moodMessage } from '../../ui/mood';
import { useTheme } from '../../ui/theme';

export default function Today() {
  const t = useTheme();
  const store = useStore();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const today = dateKey(store.now);
  const active = store.tasks.filter(task => task.status !== 'done');
  const planned = active.filter(task => task.startAt && occursOnDay(task.startAt, task.duration, today)).sort((a, b) => a.startAt!.localeCompare(b.startAt!));
  const events = store.events.filter(event => occursOnDay(event.startAt, event.duration, today)).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const due = active.filter(task => task.dueDate && task.dueDate <= today && !planned.some(item => item.id === task.id));
  const timed = [
    ...events.map(event => ({ kind: 'event' as const, at: event.startAt, event })),
    ...planned.map(task => ({ kind: 'task' as const, at: task.startAt!, task })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const anytime = active.filter(task => !planned.some(item => item.id === task.id) && !due.some(item => item.id === task.id));
  const nextTask = planned[0] ?? due[0] ?? anytime[0];
  const hasContent = Boolean(store.tasks.length || store.notes.length || events.length);
  const q = query.trim().toLocaleLowerCase();
  const foundTasks = store.tasks.filter(task => `${task.title} ${task.details}`.toLocaleLowerCase().includes(q));
  const foundNotes = store.notes.filter(note => `${note.title} ${note.body}`.toLocaleLowerCase().includes(q));
  const foundProjects = store.projects.filter(project => project.name.toLocaleLowerCase().includes(q));
  const hour = store.now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const date = store.now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const foundTotal = foundTasks.length + foundNotes.length + foundProjects.length;
  const doneToday = store.tasks.filter(task => task.status === 'done' && dateKey(new Date(task.updatedAt)) === today).length;
  const overdue = active.filter(task => task.dueDate && task.dueDate < today).length;
  const moodContext = { open: active.length, total: store.tasks.length, doneToday, overdue, planned: planned.length, events: events.length, notes: store.notes.length, hour, nextTitle: nextTask?.title };
  const mood = pickMood(moodContext);
  const message = moodMessage(mood, moodContext);

  async function addTask() {
    const value = title.trim();
    if (!value || busy) return;
    setBusy(true); setError('');
    try {
      await store.mutate(repo => repo.saveTask(randomUUID(), { title: value, details: '', projectId: null, status: 'todo', dueDate: null, startAt: null, duration: 30, remind: 0 }));
      setTitle('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not add this task.'); }
    finally { setBusy(false); }
  }

  function toggleSearch() {
    setSearchOpen(open => !open);
    setQuery('');
  }

  return <Screen>
    <Header title="Today" subtitle={`${greeting} · ${date}`} right={<>
      <IconButton name="search-outline" label="Search" active={searchOpen} onPress={toggleSearch} />
      <IconButton name="settings-outline" label="Settings and privacy" onPress={() => router.push('/settings')} />
    </>} />
    {!!store.notice && <Card style={{ padding: 16, backgroundColor: t.goldSoft }}><Body accessibilityRole="alert" style={{ fontSize: 14 }}>{store.notice}</Body></Card>}

    {searchOpen ? <>
      <Search value={query} onChange={setQuery} />
      {!q ? <Body secondary style={{ textAlign: 'center', paddingVertical: 18 }}>Search tasks, notes, and projects.</Body> : <Section title="Search results" count={foundTotal}>
        {!foundTotal && <Empty icon="search-outline" title="Nothing found" detail="Try a different word." />}
        {!!foundTasks.length && <Card>{foundTasks.map(task => <TaskRow key={task.id} task={task} />)}</Card>}
        {!!foundNotes.length && <Card>{foundNotes.map(note => <NoteRow key={note.id} note={note} />)}</Card>}
        {!!foundProjects.length && <Card>{foundProjects.map(project => <Pressable key={project.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })} style={({ pressed }) => ({ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 0.5, borderBottomColor: t.border, opacity: pressed ? 0.6 : 1 })}><IconTile icon="folder" tone={project.color} size={38} /><Body style={{ flex: 1, fontWeight: '600' }}>{project.name}{project.archived ? ' · Archived' : ''}</Body><Icon name="chevron-forward" size={14} color={t.muted} /></Pressable>)}</Card>}
      </Section>}
    </> : <>
      <Card style={{ paddingTop: 28, paddingHorizontal: 14, paddingBottom: 14, gap: 10, backgroundColor: t.banner, borderWidth: 0, overflow: 'visible' }}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: 'hidden' }]}>
          <Image source={require('../../../assets/brand/banner-landscape.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 96 }}>
          <View style={{ marginLeft: -18, marginRight: -10, marginTop: -12, width: 92, height: 92 }}>
            <View style={{ position: 'absolute', left: 0, top: 0, width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(242,184,75,0.16)' }} />
            <Owl size={92} mood={mood} />
          </View>
          <View style={{ flex: 1, backgroundColor: t.paper, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(43,35,27,0.08)', boxShadow: '0px 6px 16px rgba(30,20,10,0.12)' }}>
            <View style={{ position: 'absolute', left: -9, top: 22, width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: t.paper }} />
            <Body style={{ color: t.paperInk, fontSize: 13, lineHeight: 18 }}>{message}</Body>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: t.paper, borderRadius: 16, paddingLeft: 13, paddingRight: 5, minHeight: 46, borderWidth: 1, borderColor: 'rgba(43,35,27,0.08)', boxShadow: '0px 4px 12px rgba(30,20,10,0.12)' }}>
            <TextInput
              accessibilityLabel="New task title"
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={() => void addTask()}
              placeholder="Add a task…"
              placeholderTextColor="#8B7B67"
              returnKeyType="done"
              style={[{ flex: 1, minHeight: 42, color: t.paperInk, fontSize: 15.5, paddingHorizontal: 0 }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null]}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Add" accessibilityState={{ disabled: busy || !title.trim() }} disabled={busy || !title.trim()} onPress={() => void addTask()} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.gold, opacity: busy || !title.trim() ? 0.4 : pressed ? 0.75 : 1 })}>
              <Icon name="arrow-up" size={17} color={t.paperInk} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="New note" onPress={() => router.push({ pathname: '/edit', params: { kind: 'note' } })} style={({ pressed }) => ({ width: 48, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 1, backgroundColor: t.paper, borderWidth: 1, borderColor: 'rgba(43,35,27,0.08)', boxShadow: '0px 4px 12px rgba(30,20,10,0.12)', opacity: pressed ? 0.7 : 1 })}>
            <Icon name="document-text-outline" size={16} color={t.paperInk} />
            <Body style={{ color: t.paperInk, fontSize: 9.5, lineHeight: 11.5, fontWeight: '600' }}>Note</Body>
          </Pressable>
        </View>
      </Card>
      <ErrorMessage message={error} />

      {!!(timed.length || due.length) && <Section title="Your day" count={timed.length + due.length}>
        <Card>
          {timed.map(item => item.kind === 'event' ? <EventRow key={item.event.id} event={item.event} /> : <TaskRow key={item.task.id} task={item.task} />)}
          {due.map(task => <TaskRow key={task.id} task={task} />)}
        </Card>
      </Section>}

      {!!anytime.length && <Section title="Anytime" count={anytime.length}><Card>{anytime.map(task => <TaskRow key={task.id} task={task} />)}</Card></Section>}

      {!!store.notes.length && <Section title="Notes" count={store.notes.length}><Card>{store.notes.map(note => <NoteRow key={note.id} note={note} />)}</Card></Section>}

      {!hasContent && <Empty icon="sunny-outline" title="A clear day" detail="Add a task above, or write a note." />}
    </>}
  </Screen>;
}
