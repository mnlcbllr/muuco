import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { migrate } from './repository';

export async function openDatabase() {
  const db = await SQLite.openDatabaseAsync('muuco.db');
  try {
    if (Platform.OS !== 'web') {
      const cipher = await db.getFirstAsync('PRAGMA cipher_version');
      if (!cipher) throw new Error('Muuco needs a development build with encrypted SQLite. Expo Go cannot open this app. Run npx expo run:android or create an Expo development build.');
      let key = await SecureStore.getItemAsync('muuco.database-key');
      if (!key) {
        // Never replace a missing key for an existing encrypted database.
        try {
          const existing = await db.getFirstAsync('SELECT name FROM sqlite_master LIMIT 1');
          if (existing) throw new Error('existing');
        } catch { throw new Error('The database exists, but its device key is unavailable. No data has been deleted.'); }
        key = Array.from(await Crypto.getRandomBytesAsync(32), b => b.toString(16).padStart(2, '0')).join('');
        await SecureStore.setItemAsync('muuco.database-key', key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
      }
      if (!/^[0-9a-f]{64}$/.test(key)) throw new Error('The device encryption key is invalid. No data has been changed.');
      await db.execAsync(`PRAGMA key = '${key}';`);
    }
    await migrate(db);
    return db;
  } catch (error) { await db.closeAsync(); throw error; }
}
