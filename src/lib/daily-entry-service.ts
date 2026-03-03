import { STORAGE_KEYS } from '@/lib/constants';
import { mmkv } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type DailyEntry = Database['public']['Tables']['daily_entries']['Row'];
type DailyEntryInsert = Database['public']['Tables']['daily_entries']['Insert'];

/**
 * Local entry stored in MMKV before syncing.
 */
export interface LocalEntry {
  id: string;
  sprint_id: string;
  user_id: string;
  day_number: number;
  date: string;
  content: string;
  synced: boolean;
  created_at: string;
}

// ──────────── MMKV Offline-First Layer ────────────

function getLocalKey(sprintId: string, dayNumber: number): string {
  return STORAGE_KEYS.dailyEntry(sprintId, dayNumber);
}

function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get a daily entry from MMKV.
 */
export function getLocalEntry(
  sprintId: string,
  dayNumber: number,
): LocalEntry | undefined {
  return mmkv.getObject<LocalEntry>(getLocalKey(sprintId, dayNumber));
}

/**
 * Save a daily entry to MMKV first (offline-first).
 * daily_entries are immutable once synced — only allow write if not yet synced.
 */
export function saveLocalEntry(params: {
  sprint_id: string;
  user_id: string;
  day_number: number;
  date: string;
  content: string;
}): LocalEntry {
  const key = getLocalKey(params.sprint_id, params.day_number);
  const existing = getLocalEntry(params.sprint_id, params.day_number);

  // Immutable: if already synced, don't overwrite
  if (existing?.synced) {
    throw new Error('Entry already synced and cannot be edited.');
  }

  const entry: LocalEntry = {
    id: existing?.id ?? generateLocalId(),
    sprint_id: params.sprint_id,
    user_id: params.user_id,
    day_number: params.day_number,
    date: params.date,
    content: params.content.trim(),
    synced: false,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };

  mmkv.setObject(key, entry);

  // Track unsynced
  addUnsyncedEntry(params.sprint_id, params.day_number);

  return entry;
}

/**
 * Track unsynced entry keys.
 */
function addUnsyncedEntry(sprintId: string, dayNumber: number): void {
  const unsynced = getUnsyncedEntryKeys();
  const key = `${sprintId}:${dayNumber}`;
  if (!unsynced.includes(key)) {
    unsynced.push(key);
    mmkv.setObject(STORAGE_KEYS.UNSYNCED_ENTRIES, unsynced);
  }
}

/**
 * Get all unsynced entry keys.
 */
export function getUnsyncedEntryKeys(): string[] {
  return mmkv.getObject<string[]>(STORAGE_KEYS.UNSYNCED_ENTRIES) ?? [];
}

/**
 * Remove a key from unsynced entries.
 */
function removeUnsyncedEntry(key: string): void {
  const unsynced = getUnsyncedEntryKeys().filter((k) => k !== key);
  mmkv.setObject(STORAGE_KEYS.UNSYNCED_ENTRIES, unsynced);
}

// ──────────── Supabase Sync Layer ────────────

/**
 * Fetch entries from Supabase for a given sprint.
 */
export async function fetchEntriesForSprint(
  sprintId: string,
): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('sprint_id', sprintId)
    .order('day_number', { ascending: true });

  if (error) throw error;
  return (data as DailyEntry[]) ?? [];
}

/**
 * Fetch a single entry from Supabase by sprint + day.
 */
export async function fetchRemoteEntry(
  sprintId: string,
  dayNumber: number,
): Promise<DailyEntry | null> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('sprint_id', sprintId)
    .eq('day_number', dayNumber)
    .maybeSingle();

  if (error) throw error;
  return data as DailyEntry | null;
}

/**
 * Push a local entry to Supabase.
 * Uses insert (entries are immutable — no update needed).
 */
export async function pushEntryToSupabase(entry: LocalEntry): Promise<void> {
  const insert: DailyEntryInsert = {
    sprint_id: entry.sprint_id,
    user_id: entry.user_id,
    day_number: entry.day_number,
    date: entry.date,
    content: entry.content,
    synced: true,
  };

  const { error } = await supabase.from('daily_entries').insert(insert);

  // Ignore unique constraint violations (already synced)
  if (error && error.code !== '23505') {
    throw error;
  }
}

/**
 * Sync all unsynced entries to Supabase.
 * Returns the number of synced records.
 */
export async function syncUnsyncedEntries(): Promise<number> {
  const keys = getUnsyncedEntryKeys();
  let syncedCount = 0;

  for (const key of keys) {
    const [sprintId, dayStr] = key.split(':');
    if (!sprintId || !dayStr) continue;

    const dayNumber = parseInt(dayStr, 10);
    const entry = getLocalEntry(sprintId, dayNumber);
    if (!entry || entry.synced) {
      removeUnsyncedEntry(key);
      continue;
    }

    try {
      await pushEntryToSupabase(entry);
      entry.synced = true;
      mmkv.setObject(getLocalKey(sprintId, dayNumber), entry);
      removeUnsyncedEntry(key);
      syncedCount++;
    } catch {
      // Will retry on next sync
    }
  }

  return syncedCount;
}
