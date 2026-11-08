import type { SQLiteDatabase } from 'expo-sqlite';
import { checkSlot, validateTask, validateTitle, type Event, type Note, type Project, type Snapshot, type Task, type TaskInput } from '../core/model';
import { schema } from './schema';

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) > 1) throw new Error('This database needs a newer version of Muuco. Your data has not been changed.');
  if (!row?.user_version) await db.withTransactionAsync(() => db.execAsync(schema));
  // The old capture inbox is gone. Convert any loose thoughts into notes so
  // nothing is stranded, then mark them consumed. Safe to run on every open.
  // A malformed legacy row must never prevent the rest of the workspace from opening.
  try {
    await db.withTransactionAsync(() => db.execAsync(`
      INSERT OR IGNORE INTO notes (id,title,body,projectId,updatedAt,sourceCaptureId)
      SELECT 'legacy-' || id,
             CASE WHEN length(trim(substr(trim(text), 1, min(200, instr(trim(text) || char(10), char(10)) - 1)))) = 0
                  THEN 'Untitled thought'
                  ELSE trim(substr(trim(text), 1, min(200, instr(trim(text) || char(10), char(10)) - 1)))
             END,
             substr(text, 1, 30000), NULL, createdAt, id
      FROM captures
      WHERE convertedAt IS NULL
        AND NOT EXISTS (SELECT 1 FROM notes WHERE sourceCaptureId = captures.id);
      UPDATE captures SET convertedAt = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE convertedAt IS NULL;
    `));
  } catch {
    // Leave legacy captures untouched if they cannot be converted.
  }
}

export function repository(db: SQLiteDatabase) {
  async function snapshot(): Promise<Snapshot> {
    // All repository calls are serialized by the provider, including these reads.
    return {
      projects: await db.getAllAsync<Project>('SELECT * FROM projects ORDER BY createdAt DESC'),
      tasks: await db.getAllAsync<Task>('SELECT * FROM tasks ORDER BY createdAt DESC'),
      notes: await db.getAllAsync<Note>('SELECT * FROM notes ORDER BY updatedAt DESC'),
      events: await db.getAllAsync<Event>('SELECT * FROM events ORDER BY startAt'),
    };
  }
  return {
    snapshot,
    async saveProject(id: string, name: string, color: string) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Choose a valid project color.');
      await db.runAsync('INSERT INTO projects (id,name,color,createdAt) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,color=excluded.color', id, validateTitle(name), color, new Date().toISOString());
    },
    async archiveProject(id: string, archived: boolean) {
      await db.runAsync('UPDATE projects SET archived=? WHERE id=?', archived ? 1 : 0, id);
    },
    async saveTask(id: string, input: TaskInput, revision?: number) {
      const task = validateTask(input);
      await db.withTransactionAsync(async () => {
        const data = await snapshot(); checkSlot(task, data.tasks, data.events, id);
        const now = new Date().toISOString();
        if (revision !== undefined) {
          const result = await db.runAsync('UPDATE tasks SET title=?,details=?,projectId=?,status=?,dueDate=?,startAt=?,duration=?,remind=?,updatedAt=?,revision=revision+1 WHERE id=? AND revision=?', task.title, task.details, task.projectId, task.status, task.dueDate, task.startAt, task.duration, task.remind, now, id, revision);
          if (!result.changes) throw new Error('This task changed while you were editing. Reopen it to use the latest version.');
        } else {
          await db.runAsync('INSERT INTO tasks (id,title,details,projectId,status,dueDate,startAt,duration,remind,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)', id, task.title, task.details, task.projectId, task.status, task.dueDate, task.startAt, task.duration, task.remind, now, now);
        }
      });
    },
    async saveNote(id: string, title: string, body: string, projectId: string | null, revision?: number) {
      const name = validateTitle(title);
      if (body.length > 30000) throw new Error('Keep the note under 30,000 characters.');
      await db.withTransactionAsync(async () => {
        if (revision !== undefined) {
          const result = await db.runAsync('UPDATE notes SET title=?,body=?,projectId=?,updatedAt=?,revision=revision+1 WHERE id=? AND revision=?', name, body, projectId, new Date().toISOString(), id, revision);
          if (!result.changes) throw new Error('This note changed. Reopen it before editing again.');
        } else {
          await db.runAsync('INSERT INTO notes (id,title,body,projectId,updatedAt) VALUES (?,?,?,?,?)', id, name, body, projectId, new Date().toISOString());
        }
      });
    },
    async saveEvent(id: string, title: string, startAt: string, duration: number, revision?: number) {
      const input = validateTask({ title, startAt, duration, details: '', projectId: null, status: 'todo', dueDate: null, remind: 0 });
      await db.withTransactionAsync(async () => {
        const data = await snapshot();
        checkSlot(input, data.tasks, data.events.filter(e => e.id !== id));
        if (revision !== undefined) {
          const result = await db.runAsync('UPDATE events SET title=?,startAt=?,duration=?,revision=revision+1 WHERE id=? AND revision=?', input.title, startAt, duration, id, revision);
          if (!result.changes) throw new Error('This event changed. Reopen it before editing again.');
        } else await db.runAsync('INSERT INTO events (id,title,startAt,duration) VALUES (?,?,?,?)', id, input.title, startAt, duration);
      });
    },
    async remove(kind: 'task' | 'note' | 'event', id: string) {
      const table = { task: 'tasks', note: 'notes', event: 'events' }[kind];
      await db.runAsync(`DELETE FROM ${table} WHERE id=?`, id);
    },
  };
}
export type Repository = ReturnType<typeof repository>;
