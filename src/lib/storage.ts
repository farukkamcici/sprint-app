import { Platform } from 'react-native';

/**
 * Storage abstraction.
 * Uses MMKV on native, falls back to in-memory + localStorage on web.
 */
let storage: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean) => void;
  getNumber: (key: string) => number | undefined;
  getBoolean: (key: string) => boolean | undefined;
  delete: (key: string) => void;
  contains: (key: string) => boolean;
  getAllKeys: () => string[];
  clearAll: () => void;
};

if (Platform.OS === 'web') {
  // Web fallback using localStorage
  storage = {
    getString: (key) => {
      try {
        return localStorage.getItem(key) ?? undefined;
      } catch {
        return undefined;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, String(value));
      } catch {
        // ignore
      }
    },
    getNumber: (key) => {
      const val = localStorage.getItem(key);
      if (val === null) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    getBoolean: (key) => {
      const val = localStorage.getItem(key);
      if (val === null) return undefined;
      return val === 'true';
    },
    delete: (key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
    contains: (key) => {
      try {
        return localStorage.getItem(key) !== null;
      } catch {
        return false;
      }
    },
    getAllKeys: () => {
      try {
        return Object.keys(localStorage);
      } catch {
        return [];
      }
    },
    clearAll: () => {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
    },
  };
} else {
  // Native: use MMKV
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({ id: 'sprint-app-storage' });
}

export { storage };

/**
 * Type-safe MMKV helpers for offline-first data.
 */
export const mmkv = {
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void => storage.set(key, value),
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  setNumber: (key: string, value: number): void => storage.set(key, value),
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),
  delete: (key: string): void => storage.delete(key),
  contains: (key: string): boolean => storage.contains(key),
  getAllKeys: (): string[] => storage.getAllKeys(),
  clearAll: (): void => storage.clearAll(),

  /**
   * Get/set JSON-serializable objects.
   */
  getObject: <T>(key: string): T | undefined => {
    const raw = storage.getString(key);
    if (raw === undefined) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },
};
