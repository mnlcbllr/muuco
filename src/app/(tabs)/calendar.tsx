import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { addDays, dateKey, occursOnDay } from '../../core/model';
import { useStore } from '../../data/store';
import { Body, Card, Header, Icon, IconButton, IconTile, Screen, Section } from '../../ui/components';
import { EventRow, TaskRow } from '../../ui/items';
import { useTheme } from '../../ui/theme';

const monday = new Date(2024, 0, 1);
const weekdays = Array.from({ length: 7 }, (_, index) => addDays(monday, index).toLocaleDateString([], { weekday: 'narrow' }));

export default function Calendar() {
  const t = useTheme(); const store = useStore();
  const [selected, setSelected] = useState(() => new Date(store.now));
  const [cursor, setCursor] = useState(() => new Date(store.now.getFullYear(), store.now.getMonth(), 1));
  const [addOpen, setAddOpen] = useState(false);
  const key = dateKey(selected);
  const isToday = key === dateKey(store.now);
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -offset);
  const cells = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  const active = store.tasks.filter(task => task.status !== 'done');
  const scheduled = active.filter(task => task.startAt && occursOnDay(task.startAt, task.duration, key)).sort((a, b) => a.startAt!.localeCompare(b.startAt!));
  const events = store.events.filter(event => occursOnDay(event.startAt, event.duration, key)).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const due = active.filter(task => task.dueDate === key && !scheduled.some(item => item.id === task.id));
  const agenda = [
    ...events.map(event => ({ kind: 'event' as const, at: event.startAt, event })),
    ...scheduled.map(task => ({ kind: 'task' as const, at: task.startAt!, task })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  function marked(day: string) {
    return active.some(task => task.dueDate === day || (task.startAt && occursOnDay(task.startAt, task.duration, day)))
      || store.events.some(event => occursOnDay(event.startAt, event.duration, day));
  }
  function goToday() {
    const now = new Date(store.now);
    setSelected(now);
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  }
  function moveMonth(step: number) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + step, 1);
    setCursor(next);
    const now = store.now;
    setSelected(next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth() ? new Date(now) : next);
  }
  function add(kind: 'event' | 'task') {
    setAddOpen(false);
    router.push({ pathname: '/edit', params: { kind, day: key } });
  }

  return <Screen>
    <Header title="Calendar" right={<IconButton name="add" label="Add" active={addOpen} onPress={() => setAddOpen(open => !open)} />} />
    {addOpen && <Card>
      <Pressable accessibilityRole="button" accessibilityLabel="Add event" onPress={() => add('event')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 0.5, borderBottomColor: t.border, opacity: pressed ? 0.6 : 1 })}>
        <IconTile icon="calendar-outline" tone={t.gold} size={38} />
        <View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>Add event</Body><Body secondary style={{ fontSize: 12.5 }}>A fixed block of time</Body></View>
        <Icon name="chevron-forward" size={14} color={t.muted} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Add task" onPress={() => add('task')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: pressed ? 0.6 : 1 })}>
        <IconTile icon="checkmark-circle-outline" tone={t.accent} size={38} />
        <View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>Add task</Body><Body secondary style={{ fontSize: 12.5 }}>Give a task a time block</Body></View>
        <Icon name="chevron-forward" size={14} color={t.muted} />
      </Pressable>
    </Card>}
    <Card style={{ padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton name="chevron-back" label="Previous month" onPress={() => moveMonth(-1)} />
        <View style={{ alignItems: 'center', gap: 1 }}>
          <Body style={{ fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>{cursor.toLocaleDateString([], { month: 'long' })}</Body>
          <Body secondary style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.2 }}>{cursor.getFullYear()}</Body>
        </View>
        <IconButton name="chevron-forward" label="Next month" onPress={() => moveMonth(1)} />
      </View>
      <View style={{ flexDirection: 'row' }}>{weekdays.map((day, index) => <View key={index} style={{ width: '14.2857%', alignItems: 'center' }}><Body secondary style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{day}</Body></View>)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map(day => {
          const dayKey = dateKey(day);
          const selectedDay = dayKey === key;
          const today = dayKey === dateKey(store.now);
          const currentMonth = day.getMonth() === cursor.getMonth();
          const hasItems = marked(dayKey);
          return <Pressable
            key={dayKey}
            accessibilityRole="button"
            accessibilityLabel={day.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            accessibilityState={{ selected: selectedDay }}
            onPress={() => { setSelected(day); if (!currentMonth) setCursor(new Date(day.getFullYear(), day.getMonth(), 1)); }}
            style={{ width: '14.2857%', height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: selectedDay ? t.accent : 'transparent', borderWidth: !selectedDay && today ? 1 : 0, borderColor: t.accent }}>
              <Body style={{ fontSize: 13.5, fontWeight: selectedDay || today ? '700' : '500', color: selectedDay ? (t.dark ? '#171122' : t.white) : today ? t.accent : currentMonth ? t.text : t.muted }}>{day.getDate()}</Body>
            </View>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: hasItems ? selectedDay ? (t.dark ? '#171122' : t.white) : t.accent : 'transparent' }} />
          </Pressable>;
        })}
      </View>
      {!isToday && <Pressable accessibilityRole="button" onPress={goToday} style={{ alignSelf: 'center', minHeight: 32, justifyContent: 'center' }}><Body style={{ color: t.accent, fontSize: 13, fontWeight: '700' }}>Back to today</Body></Pressable>}
    </Card>
    <Section title={isToday ? 'Today' : selected.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} count={agenda.length + due.length}>
      {agenda.length || due.length ? <Card>
        {agenda.map(item => item.kind === 'event' ? <EventRow key={item.event.id} event={item.event} /> : <TaskRow key={item.task.id} task={item.task} />)}
        {due.map(task => <TaskRow key={task.id} task={task} />)}
      </Card> : <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile icon="calendar-outline" tone={t.accent} size={38} />
        <View style={{ flex: 1, gap: 2 }}><Body style={{ fontWeight: '600', fontSize: 14 }}>Nothing planned.</Body><Body secondary style={{ fontSize: 12.5 }}>Pick another day or add something.</Body></View>
      </Card>}
    </Section>
  </Screen>;
}
