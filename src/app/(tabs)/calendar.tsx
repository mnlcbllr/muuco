import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { addDays, dateKey, formatTime, occursOnDay } from '../../core/model';
import { useStore } from '../../data/store';
import { Action, Body, Card, Empty, Header, IconButton, Screen, Section, s } from '../../ui/components';
import { EventRow, TaskRow } from '../../ui/items';
import { useTheme } from '../../ui/theme';

export default function Calendar() {
  const t = useTheme(); const store = useStore();
  const [selected, setSelected] = useState(() => new Date());
  const key = dateKey(selected);
  const weekStart = addDays(selected, -((selected.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const scheduled = store.tasks.filter(task => task.startAt && occursOnDay(task.startAt, task.duration, key));
  const events = store.events.filter(event => occursOnDay(event.startAt, event.duration, key));
  const agenda = [...scheduled.map(task => ({ kind: 'task' as const, startAt: task.startAt!, task })), ...events.map(event => ({ kind: 'event' as const, startAt: event.startAt, event }))].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const unscheduled = store.tasks.filter(task => !task.startAt && task.status !== 'done');
  return <Screen><Header title="Calendar" subtitle="A place for your plans, and a little space between." />
    <Card style={{ padding: 14, gap: 14 }}><View style={s.between}><IconButton name="chevron-back" label="Previous week" onPress={() => setSelected(addDays(selected, -7))} /><Body style={{ fontSize: 17, fontWeight: '600' }}>{selected.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Body><IconButton name="chevron-forward" label="Next week" onPress={() => setSelected(addDays(selected, 7))} /></View><View style={{ flexDirection: 'row', gap: 3 }}>{week.map(day => {
      const dayKey = dateKey(day), active = dayKey === key;
      const hasItems = store.tasks.some(task => task.startAt && occursOnDay(task.startAt, task.duration, dayKey)) || store.events.some(event => occursOnDay(event.startAt, event.duration, dayKey));
      return <Pressable key={dayKey} accessibilityRole="button" accessibilityLabel={day.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} accessibilityState={{ selected: active }} onPress={() => setSelected(day)} style={{ flex: 1, minHeight: 82, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: active ? t.accent : 'transparent' }}><Body style={{ color: active ? (t.dark ? t.background : t.white) : t.secondary, fontSize: 11 }}>{day.toLocaleDateString([], { weekday: 'narrow' })}</Body><Body style={{ color: active ? (t.dark ? t.background : t.white) : t.text, fontSize: 18, fontWeight: '600' }}>{day.getDate()}</Body><View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: hasItems ? active ? t.gold : t.accent : 'transparent' }} /></Pressable>;
    })}</View><Pressable accessibilityRole="button" onPress={() => setSelected(new Date())} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}><Body style={{ color: t.accentText, fontSize: 14 }}>Back to today</Body></Pressable></Card>
    <Section title={key === dateKey(store.now) ? 'Today’s plan' : selected.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} count={agenda.length}>
      {agenda.length ? <View style={{ gap: 12 }}>{agenda.map(item => <View key={item.kind === 'task' ? item.task.id : item.event.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}><View style={{ width: 62, paddingTop: 18 }}><Body secondary style={{ fontSize: 12 }}>{dateKey(new Date(item.startAt)) === key ? formatTime(item.startAt) : 'Continues'}</Body></View><View style={{ flex: 1 }}>{item.kind === 'task' ? <Card><TaskRow task={item.task} /></Card> : <Card style={{ borderLeftWidth: 3, borderLeftColor: t.gold }}><EventRow event={item.event} /></Card>}</View></View>)}</View> : <Empty icon="calendar-outline" title="Your day has room" detail="Add a commitment or schedule a task. Muuco keeps their times from overlapping." />}
      <Action title="Add a commitment" secondary icon="add" onPress={() => router.push({ pathname: '/edit', params: { kind: 'event', day: key } })} />
    </Section>
    <Section title="Waiting for a time" count={unscheduled.length}><Body secondary style={{ fontSize: 14 }}>Open a task to choose a time or find an available slot.</Body>{unscheduled.length ? <Card>{unscheduled.map(task => <TaskRow key={task.id} task={task} />)}</Card> : <Body secondary style={{ fontSize: 14 }}>No unscheduled tasks. A little breathing room.</Body>}<Action title="New task" secondary icon="add" onPress={() => router.push({ pathname: '/edit', params: { kind: 'task', day: key } })} /></Section>
  </Screen>;
}
