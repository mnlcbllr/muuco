import type { Task } from '../core/model';

export type ReminderStatus = { state: 'ready' | 'disabled' | 'unsupported' | 'error'; message: string };
export async function syncReminders(_tasks: Task[]): Promise<ReminderStatus> {
  return { state: 'unsupported', message: 'Local reminders are available in the Android and iOS development builds.' };
}
export async function requestReminders(): Promise<boolean> { return false; }
export function subscribeToReminders(_open: (id: string) => void): () => void { return () => {}; }
