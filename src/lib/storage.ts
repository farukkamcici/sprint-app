import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'sprint-app-storage',
});

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
