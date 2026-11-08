export const statuses = ['todo', 'in_progress', 'done'] as const;
export type Status = (typeof statuses)[number];
export const statusLabels: Record<Status, string> = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
export const projectColors = ['#7560AF', '#427FA5', '#A76A37', '#45846D'] as const;

export type Project = { id: string; name: string; color: string; archived: number; createdAt: string };
export type Task = {
  id: string; title: string; details: string; projectId: string | null; status: Status;
  dueDate: string | null; startAt: string | null; duration: number; remind: number;
  createdAt: string; updatedAt: string; revision: number; sourceCaptureId: string | null;
};
export type Note = { id: string; title: string; body: string; projectId: string | null; updatedAt: string; revision: number; sourceCaptureId: string | null };
export type Capture = { id: string; text: string; createdAt: string; convertedAt: string | null };
export type Event = { id: string; title: string; startAt: string; duration: number; revision: number };
export type Snapshot = { projects: Project[]; tasks: Task[]; notes: Note[]; captures: Capture[]; events: Event[] };
export const emptySnapshot: Snapshot = { projects: [], tasks: [], notes: [], captures: [], events: [] };
export type TaskInput = Pick<Task, 'title' | 'details' | 'projectId' | 'status' | 'dueDate' | 'startAt' | 'duration' | 'remind'>;

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dateFromKey(key: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error('Choose a valid date.');
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (dateKey(date) !== key) throw new Error('Choose a valid date.');
  return date;
}

export function localInstant(day: string, time: string): string {
  dateFromKey(day);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Choose a valid time.');
  const [year, month, date] = day.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(year, month - 1, date, hours, minutes);
  if (dateKey(result) !== day || result.getHours() !== hours || result.getMinutes() !== minutes) {
    throw new Error('That local time does not exist because the clocks change. Choose another time.');
  }
  return result.toISOString();
}

export function timeKey(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function addDays(date: Date, count: number): Date {
  const next = new Date(date); next.setDate(next.getDate() + count); return next;
}
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
export function formatDay(key: string): string {
  return dateFromKey(key).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
export function validateTitle(title: string): string {
  const value = title.trim();
  if (!value) throw new Error('Give this a name first.');
  if (value.length > 200) throw new Error('Keep the name under 200 characters. Longer thoughts can go in the details.');
  return value;
}
export function validateTask(input: TaskInput): TaskInput {
  const title = validateTitle(input.title);
  if (!statuses.includes(input.status)) throw new Error('Choose a valid task status.');
  if (!Number.isInteger(input.duration) || input.duration < 5 || input.duration > 720) throw new Error('Duration must be 5–720 minutes.');
  if (input.details.length > 30000) throw new Error('Keep the details under 30,000 characters.');
  if (input.dueDate) dateFromKey(input.dueDate);
  if (input.startAt && !Number.isFinite(Date.parse(input.startAt))) throw new Error('Choose a valid scheduled time.');
  return { ...input, title, remind: input.remind ? 1 : 0 };
}
export function overlaps(a: { startAt: string; duration: number }, b: { startAt: string; duration: number }): boolean {
  const startA = Date.parse(a.startAt), startB = Date.parse(b.startAt);
  return startA < startB + b.duration * 60000 && startB < startA + a.duration * 60000;
}
export function occursOnDay(startAt: string, duration: number, day: string): boolean {
  const start = dateFromKey(day); start.setHours(0, 0, 0, 0);
  const end = addDays(start, 1);
  const instant = Date.parse(startAt);
  return instant < end.getTime() && instant + duration * 60000 > start.getTime();
}
export function checkSlot(task: TaskInput, tasks: Task[], events: Event[], exceptId?: string): void {
  if (!task.startAt || task.status === 'done') return;
  const slot = { startAt: task.startAt, duration: task.duration };
  const conflict = [...tasks.filter(t => t.id !== exceptId && t.status !== 'done' && t.startAt), ...events]
    .find(t => t.startAt && overlaps(slot, { startAt: t.startAt, duration: t.duration }));
  if (conflict) throw new Error(`This overlaps “${conflict.title}”. Choose another time.`);
}

// One contiguous block per task. The user confirms the proposed time before it is saved.
export function suggestSlot(task: TaskInput, tasks: Task[], events: Event[], day: string, now = new Date(), exceptId?: string): string | null {
  const date = dateFromKey(day);
  if (task.dueDate && day > task.dueDate) throw new Error('This day is after the deadline. Pick an earlier day, or schedule late work manually.');
  for (let minute = 9 * 60; minute + task.duration <= 18 * 60; minute += 15) {
    const start = new Date(date); start.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
    if (start <= now) continue;
    try {
      checkSlot({ ...task, startAt: start.toISOString(), status: 'todo' }, tasks, events, exceptId);
      return start.toISOString();
    } catch { /* Try the next interval; conflicts never move existing work. */ }
  }
  return null;
}

export function reminderCandidates(tasks: Task[], now = new Date()): Task[] {
  return tasks.filter(t => t.status !== 'done' && t.remind && t.startAt && Date.parse(t.startAt) > now.getTime())
    .sort((a, b) => a.startAt!.localeCompare(b.startAt!));
}
