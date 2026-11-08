import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, checkSlot, dateFromKey, dateKey, localInstant, occursOnDay, overlaps, reminderCandidates, suggestSlot, validateTask, type Task, type TaskInput } from '../src/core/model.ts';

const input: TaskInput = { title: 'Write proposal', details: '', projectId: null, status: 'todo', dueDate: '2026-11-10', startAt: null, duration: 30, remind: 0 };
const task = (overrides: Partial<Task> = {}): Task => ({ ...input, id: 'task-1', createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z', revision: 1, sourceCaptureId: null, ...overrides });

test('date-only deadlines survive time zones and do not become UTC instants', () => {
  for (const zone of ['Pacific/Honolulu', 'Asia/Manila', 'Europe/Berlin']) {
    const previous = process.env.TZ;
    try { process.env.TZ = zone; assert.equal(dateKey(dateFromKey('2026-11-08')), '2026-11-08'); }
    finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  }
});
test('invalid calendar dates and times are rejected', () => {
  for (const value of ['2026-02-30', 'not-a-date', '2026-13-01']) assert.throws(() => dateFromKey(value));
  assert.throws(() => localInstant('2026-11-08', '25:30'));
});
test('nonexistent daylight-saving times are not silently normalized', () => {
  const previous = process.env.TZ;
  try { process.env.TZ = 'America/New_York'; assert.throws(() => localInstant('2026-03-08', '02:30'), /clocks change/); }
  finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
test('calendar day arithmetic crosses month boundaries', () => {
  assert.equal(dateKey(addDays(dateFromKey('2026-12-31'), 1)), '2027-01-01');
});
test('task validation rejects blank titles, invalid status, and invalid durations', () => {
  assert.throws(() => validateTask({ ...input, title: '  ' }));
  for (const duration of [0, -1, 2.5, NaN, 721]) assert.throws(() => validateTask({ ...input, duration }));
  assert.throws(() => validateTask({ ...input, status: 'scheduled' as never }));
  assert.equal(validateTask({ ...input, title: '  Finish report  ' }).title, 'Finish report');
});
test('back-to-back blocks do not overlap', () => {
  const a = { startAt: '2026-11-08T09:00:00Z', duration: 30 };
  assert.equal(overlaps(a, { startAt: '2026-11-08T09:30:00Z', duration: 30 }), false);
  assert.equal(overlaps(a, { startAt: '2026-11-08T09:29:00Z', duration: 30 }), true);
});
test('scheduling protects commitments and other unfinished work', () => {
  const startAt = '2026-11-08T09:00:00Z';
  assert.throws(() => checkSlot({ ...input, startAt }, [], [{ id: 'class', title: 'Class', startAt, duration: 60, revision: 1 }]), /Class/);
  assert.throws(() => checkSlot({ ...input, startAt }, [task({ startAt })], []), /overlaps/);
  assert.doesNotThrow(() => checkSlot({ ...input, startAt }, [task({ startAt })], [], 'task-1'));
  assert.doesNotThrow(() => checkSlot({ ...input, startAt }, [task({ startAt, status: 'done' })], []));
});
test('available slot suggestions skip conflicts without moving them', () => {
  const day = '2026-11-09';
  const event = { id: 'class', title: 'Class', startAt: localInstant(day, '09:00'), duration: 60, revision: 1 };
  const before = JSON.stringify(event);
  assert.equal(suggestSlot(input, [], [event], day, dateFromKey('2026-11-08')), localInstant(day, '10:00'));
  assert.equal(JSON.stringify(event), before);
});
test('a full day produces no fictional available slot', () => {
  const day = '2026-11-09';
  assert.equal(suggestSlot(input, [], [{ id: 'busy', title: 'Busy', startAt: localInstant(day, '09:00'), duration: 540, revision: 1 }], day, dateFromKey('2026-11-08')), null);
});
test('suggestions do not schedule work after its deadline', () => {
  assert.throws(() => suggestSlot(input, [], [], '2026-11-11', dateFromKey('2026-11-08')), /after the deadline/);
});
test('work crossing midnight appears on both calendar days', () => {
  const start = localInstant('2026-11-08', '23:00');
  assert.equal(occursOnDay(start, 120, '2026-11-08'), true);
  assert.equal(occursOnDay(start, 120, '2026-11-09'), true);
  assert.equal(occursOnDay(start, 120, '2026-11-10'), false);
  assert.equal(occursOnDay(localInstant('2026-11-08', '22:00'), 120, '2026-11-09'), false);
});
test('reminders exclude completed, unscheduled, disabled, and past tasks', () => {
  const future = '2026-11-09T10:00:00Z';
  const eligible = task({ startAt: future, remind: 1 });
  assert.deepEqual(reminderCandidates([
    eligible,
    task({ id: 'done', startAt: future, remind: 1, status: 'done' }),
    task({ id: 'off', startAt: future }),
    task({ id: 'unscheduled', remind: 1 }),
    task({ id: 'past', startAt: '2026-11-01T10:00:00Z', remind: 1 }),
  ], new Date('2026-11-08T12:00:00Z')).map(t => t.id), ['task-1']);
});
