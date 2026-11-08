import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility, IosAuthorizationStatus } from 'expo-notifications';
import { reminderCandidates, type Task } from '../core/model';
import type { ReminderStatus } from './notifications';

const prefix = 'muuco-task-';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

async function channel() {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('tasks', { name: 'Task reminders', importance: AndroidImportance.DEFAULT, lockscreenVisibility: AndroidNotificationVisibility.PRIVATE });
}
function allowed(permission: Notifications.NotificationPermissionsStatus) {
  return permission.granted || permission.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}
export async function requestReminders() {
  await channel(); return allowed(await Notifications.requestPermissionsAsync());
}
export async function syncReminders(tasks: Task[]): Promise<ReminderStatus> {
  await channel();
  const permission = await Notifications.getPermissionsAsync();
  const candidates = reminderCandidates(tasks);
  // Stay below iOS's pending-notification limit. Refill on foreground; never promise unlimited coverage.
  const wanted = candidates.slice(0, 60);
  const existing = (await Notifications.getAllScheduledNotificationsAsync()).filter(n => n.identifier.startsWith(prefix));
  const keep = new Set<string>();
  for (const reminder of existing) {
    const task = wanted.find(t => prefix + t.id === reminder.identifier);
    if (allowed(permission) && task && reminder.content.data?.scheduledAt === task.startAt) keep.add(task.id);
    else await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
  }
  if (!allowed(permission)) return { state: 'disabled', message: 'Reminders are off. Allow notifications in Settings to receive task reminders.' };
  for (const task of wanted) {
    if (keep.has(task.id) || Date.parse(task.startAt!) <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: prefix + task.id,
      content: { title: 'A little nudge from Muuco', body: 'Your planned work is ready. Open Muuco to see your task.', sound: 'default', data: { taskId: task.id, scheduledAt: task.startAt } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(task.startAt!), channelId: 'tasks' },
    });
  }
  return { state: 'ready', message: candidates.length > 60 ? 'Your next 60 reminders are registered. Open Muuco again to register later reminders.' : 'Local reminders are ready. Delivery can be affected by system and battery settings.' };
}
export function subscribeToReminders(open: (id: string) => void) {
  const handle = (response: Notifications.NotificationResponse | null) => {
    const id = response?.notification.request.content.data?.taskId;
    if (response?.notification.request.identifier.startsWith(prefix) && typeof id === 'string') {
      open(id); Notifications.clearLastNotificationResponse();
    }
  };
  handle(Notifications.getLastNotificationResponse());
  const listener = Notifications.addNotificationResponseReceivedListener(handle);
  return () => listener.remove();
}
