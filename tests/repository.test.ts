import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { migrate, repository } from '../src/data/repository.ts';
import type { TaskInput } from '../src/core/model.ts';

function database() {
  const native = new DatabaseSync(':memory:');
  // Exercise production queries against real SQLite without importing a native Expo runtime.
  const db = {
    execAsync: async (sql: string) => { native.exec(sql); },
    getFirstAsync: async (sql: string, ...args: SQLInputValue[]) => native.prepare(sql).get(...args) ?? null,
    getAllAsync: async (sql: string, ...args: SQLInputValue[]) => native.prepare(sql).all(...args),
    runAsync: async (sql: string, ...args: SQLInputValue[]) => native.prepare(sql).run(...args),
    withTransactionAsync: async (operation: () => Promise<void>) => {
      native.exec('BEGIN');
      try { await operation(); native.exec('COMMIT'); }
      catch (error) { native.exec('ROLLBACK'); throw error; }
    },
  } as unknown as SQLiteDatabase;
  return { native, db };
}
const input: TaskInput = { title: 'Finish report', details: '', status: 'todo', projectId: null, dueDate: '2026-11-12', startAt: null, duration: 30, remind: 0 };

test('migrations are idempotent and keep existing data', async () => {
  const { native, db } = database();
  try { await migrate(db); const repo = repository(db); await repo.addCapture('one', 'Remember this'); await migrate(db); assert.equal((await repo.snapshot()).captures[0].text, 'Remember this'); }
  finally { native.close(); }
});
test('a newer database is rejected rather than overwritten', async () => {
  const { native, db } = database();
  try { native.exec('PRAGMA user_version = 99'); await assert.rejects(migrate(db), /newer version/); assert.equal((native.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 99); }
  finally { native.close(); }
});
test('titles containing SQL syntax are stored as content', async () => {
  const { native, db } = database();
  try { await migrate(db); const repo = repository(db); await repo.saveTask('one', { ...input, title: "Robert'); DROP TABLE tasks;--" }); assert.equal((await repo.snapshot()).tasks[0].title, "Robert'); DROP TABLE tasks;--"); }
  finally { native.close(); }
});
test('capture conversion is atomic and cannot happen twice', async () => {
  const { native, db } = database();
  try {
    await migrate(db); const repo = repository(db); await repo.addCapture('capture', 'A thought');
    await repo.saveTask('task', input, undefined, 'capture');
    await assert.rejects(repo.saveNote('note', 'A thought', 'Body', null, undefined, 'capture'), /already been organized/);
    const state = await repo.snapshot(); assert.equal(state.captures.length, 0); assert.equal(state.tasks.length, 1); assert.equal(state.notes.length, 0);
    assert.equal((native.prepare('SELECT text FROM captures WHERE id=?').get('capture') as { text: string }).text, 'A thought');
  } finally { native.close(); }
});
test('failed conversion restores the capture and creates no task', async () => {
  const { native, db } = database();
  try {
    await migrate(db); const repo = repository(db); await repo.addCapture('capture', 'Keep me');
    await assert.rejects(repo.saveTask('task', { ...input, projectId: 'missing' }, undefined, 'capture'));
    const state = await repo.snapshot(); assert.equal(state.captures.length, 1); assert.equal(state.tasks.length, 0);
  } finally { native.close(); }
});
test('stale edits cannot overwrite newer task changes', async () => {
  const { native, db } = database();
  try {
    await migrate(db); const repo = repository(db); await repo.saveTask('task', input);
    await repo.saveTask('task', { ...input, title: 'The current version' }, 1);
    await assert.rejects(repo.saveTask('task', { ...input, title: 'Stale version' }, 1), /changed/);
    assert.equal((await repo.snapshot()).tasks[0].title, 'The current version');
  } finally { native.close(); }
});
test('rescheduling leaves the deadline and task status unchanged', async () => {
  const { native, db } = database();
  try {
    await migrate(db); const repo = repository(db); await repo.saveTask('task', input);
    await repo.saveTask('task', { ...input, startAt: '2026-11-09T10:00:00Z' }, 1);
    const task = (await repo.snapshot()).tasks[0]; assert.equal(task.dueDate, input.dueDate); assert.equal(task.status, 'todo');
  } finally { native.close(); }
});
test('overlapping saves fail without adding another calendar entry', async () => {
  const { native, db } = database();
  try {
    await migrate(db); const repo = repository(db); const startAt = '2026-11-09T10:00:00Z';
    await repo.saveEvent('class', 'Class', startAt, 60);
    await assert.rejects(repo.saveTask('task', { ...input, startAt }), /Class/);
    assert.equal((await repo.snapshot()).tasks.length, 0);
  } finally { native.close(); }
});
test('archiving preserves project tasks and notes', async () => {
  const { native, db } = database();
  try {
    await migrate(db); const repo = repository(db); await repo.saveProject('project', 'School', '#7560AF');
    await repo.saveTask('task', { ...input, projectId: 'project' }); await repo.saveNote('note', 'Research', 'Keep this', 'project');
    await repo.archiveProject('project', true);
    const state = await repo.snapshot(); assert.equal(state.projects[0].archived, 1); assert.equal(state.tasks.length, 1); assert.equal(state.notes.length, 1);
  } finally { native.close(); }
});
test('note edits use revision checks', async () => {
  const { native, db } = database();
  try {
    await migrate(db); const repo = repository(db); await repo.saveNote('note', 'Notes', 'First', null); await repo.saveNote('note', 'Notes', 'Second', null, 1);
    await assert.rejects(repo.saveNote('note', 'Notes', 'Old', null, 1), /changed/); assert.equal((await repo.snapshot()).notes[0].body, 'Second');
  } finally { native.close(); }
});
