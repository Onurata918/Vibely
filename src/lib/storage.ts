import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Account, CurrentUser, HistoryItem } from './types';

// Orijinal prototipteki `store` nesnesinin (localStorage) AsyncStorage karsiligi.
const KEYS = {
  user: 'vibely_user',
  accounts: 'vibely_accounts',
  history: 'vibely_history',
  okey101Sound: 'vibely_okey101_sound',
} as const;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // sessizce yut - prototip de ayni sekilde davraniyordu
  }
}

export const store = {
  getUser: () => readJSON<CurrentUser | null>(KEYS.user, null),
  setUser: (v: CurrentUser | null) => writeJSON(KEYS.user, v),

  getAccounts: () => readJSON<Account[]>(KEYS.accounts, []),
  setAccounts: (v: Account[]) => writeJSON(KEYS.accounts, v),

  getHistory: () => readJSON<HistoryItem[]>(KEYS.history, []),
  setHistory: (v: HistoryItem[]) => writeJSON(KEYS.history, v.slice(0, 30)),

  getOkey101Sound: () => readJSON<boolean>(KEYS.okey101Sound, true),
  setOkey101Sound: (v: boolean) => writeJSON(KEYS.okey101Sound, v),
};
