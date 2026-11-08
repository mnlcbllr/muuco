import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { openDatabase } from './database';
import { repository, type Repository } from './repository';
import { emptySnapshot, type Snapshot } from '../core/model';
import { subscribeToReminders, syncReminders, type ReminderStatus } from './notifications';
import { Action, Body, Heading } from '../ui/components';
import { useTheme } from '../ui/theme';

let connection: Promise<Repository> | undefined;
let tail: Promise<unknown> = Promise.resolve();
function serial<T>(operation: () => Promise<T>): Promise<T> {
  const next = tail.then(operation); tail = next.catch(() => {}); return next;
}
function connect() {
  return connection ??= openDatabase().then(repository).catch(error => { connection = undefined; throw error; });
}
type Store = Snapshot & {
  now: Date; reminders: ReminderStatus; notice: string;
  mutate: <T>(operation: (repo: Repository) => Promise<T>) => Promise<T>;
  refresh: () => Promise<void>;
};
const Context = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [data, setData] = useState(emptySnapshot);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(new Date());
  const [notice, setNotice] = useState('');
  const [reminders, setReminders] = useState<ReminderStatus>({ state: 'unsupported', message: 'Checking local reminders…' });
  const updateReminders = useCallback(async (snapshot: Snapshot) => {
    try { setReminders(await syncReminders(snapshot.tasks)); }
    catch { setReminders({ state: 'error', message: 'Your changes are saved, but reminders could not be updated. Open Settings to retry.' }); }
  }, []);
  const refresh = useCallback(() => serial(async () => {
    const repo = await connect();
    const next = await repo.snapshot(); setData(next); setNow(new Date()); setNotice(''); await updateReminders(next);
  }), [updateReminders]);
  const mutate = useCallback(<T,>(operation: (repo: Repository) => Promise<T>): Promise<T> => serial(async () => {
    const repo = await connect();
    const result = await operation(repo);
    try {
      const next = await repo.snapshot(); setData(next); setNotice(''); await updateReminders(next);
    } catch {
      // The write already committed. Do not report it as failed and invite a duplicate retry.
      setNotice('Your changes were saved, but the workspace could not refresh. Reopen Muuco before making further changes.');
    }
    return result;
  }), [updateReminders]);

  useEffect(() => {
    let active = true;
    refresh().then(() => { if (active) setReady(true); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Muuco could not open your local data.'); });
    return () => { active = false; };
  }, [refresh, attempt]);
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => setNow(new Date()), 60000);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh().catch(() => setReminders({ state: 'error', message: 'Could not refresh your local workspace. Reopen Muuco to retry.' }));
    });
    return () => { clearInterval(timer); sub.remove(); };
  }, [ready, refresh]);
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    return subscribeToReminders(id => router.push({ pathname: '/edit', params: { kind: 'task', id } }));
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 32, gap: 20 }}>
    {error ? <><Heading>Let’s open your space.</Heading><Body secondary>{error}</Body><Body secondary>Muuco has not reset or deleted your data.</Body><Action title="Try again" onPress={() => { setError(''); setAttempt(n => n + 1); }} /></> : <><ActivityIndicator color={theme.accent} /><Body secondary style={{ textAlign: 'center' }}>Opening your space…</Body></>}
  </View>;
  return <Context.Provider value={{ ...data, now, reminders, notice, mutate, refresh }}>{children}</Context.Provider>;
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error('StoreProvider is missing.');
  return store;
}
