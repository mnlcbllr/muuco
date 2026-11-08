import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickMood, moodMessage } from '../src/ui/mood.ts';

const base = { open: 0, total: 0, doneToday: 0, overdue: 0, planned: 0, events: 0, notes: 0, hour: 9 };

test('a finished day becomes a win', () => {
  assert.equal(pickMood({ ...base, total: 2, doneToday: 2 }), 'victory');
  assert.equal(pickMood({ ...base, total: 2 }), 'proud');
});

test('an empty day gets the right quiet mood', () => {
  assert.equal(pickMood(base), 'chill');
  assert.equal(pickMood({ ...base, notes: 1 }), 'idea');
  assert.equal(pickMood({ ...base, events: 1 }), 'plan');
});

test('progress is acknowledged before the backlog', () => {
  assert.equal(pickMood({ ...base, open: 1, total: 5, doneToday: 4 }), 'celebrate');
  assert.equal(pickMood({ ...base, open: 1, total: 2, doneToday: 1 }), 'proud');
  assert.equal(pickMood({ ...base, open: 10, total: 11, doneToday: 1 }), 'confident');
});

test('a heavy overdue backlog gets the overloaded owl', () => {
  assert.equal(pickMood({ ...base, open: 8, total: 8, overdue: 4 }), 'overloaded');
});

test('morning planning and finished batches are distinct', () => {
  assert.equal(pickMood({ ...base, open: 3, total: 3, planned: 2, hour: 9 }), 'plan');
  assert.equal(pickMood({ ...base, open: 10, total: 13, doneToday: 3, hour: 14 }), 'analytics');
});

test('default open work stays focused', () => {
  assert.equal(pickMood({ ...base, open: 3, total: 3 }), 'focus');
});

test('the banner message follows the mood', () => {
  assert.match(moodMessage('focus', { ...base, open: 3, nextTitle: 'Write the report' }), /Write the report/);
  assert.match(moodMessage('plan', { ...base, open: 3, planned: 2 }), /2 things planned/);
  assert.match(moodMessage('victory', { ...base, total: 2, doneToday: 2 }), /Everything is done/);
  assert.match(moodMessage('proud', { ...base, open: 1, doneToday: 1 }), /Nice progress/);
  assert.match(moodMessage('proud', { ...base, total: 2 }), /All clear/);
});
