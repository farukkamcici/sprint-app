import { STORAGE_KEYS } from '@/lib/constants';
import { mmkv } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type DailyCheck = Database['public']['Tables']['daily_checks']['Row'];
type DailyCheckInsert = Database['public']['Tables']['daily_checks']['Insert'];

/**
 * Local check stored in MMKV before syncing.
 */
export interface LocalCheck {
  id: string;
  sprint_id: string;
  rule_id: string;
  user_id: string;
  day_number: number;
  date: string;
  completed: boolean;
  value: number | null;
  synced: boolean;
  created_at: string;
}

// ──────────── MMKV Offline-First Layer ────────────

/**
 * Generate a deterministic key for MMKV storage.
 * Pattern: daily_checks:{sprint_id}:{date}
 * Stores an array of checks for all rules on that day.
 */
function getLocalKey(sprintId: string, date: string): string {
  return STORAGE_KEYS.dailyChecks(sprintId, date);
}

/**
 * Generate a UUID-like ID for local records.
 */
function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]!;
}

/**
 * Get all checks for a sprint on a given date from MMKV.
 */
export function getLocalChecks(sprintId: string, date: string): LocalCheck[] {
  return mmkv.getObject<LocalCheck[]>(getLocalKey(sprintId, date)) ?? [];
}

/**
 * Save a daily check to MMKV first (offline-first).
 * If a check for the same rule + date already exists, update it.
 */
export function saveLocalCheck(params: {
  sprint_id: string;
  rule_id: string;
  user_id: string;
  day_number: number;
  date: string;
  completed: boolean;
  value: number | null;
}): LocalCheck {
  const key = getLocalKey(params.sprint_id, params.date);
  const existing = getLocalChecks(params.sprint_id, params.date);

  // Find existing check for this rule on this date
  const idx = existing.findIndex((c) => c.rule_id === params.rule_id);

  const check: LocalCheck = {
    id: idx >= 0 ? existing[idx]!.id : generateLocalId(),
    sprint_id: params.sprint_id,
    rule_id: params.rule_id,
    user_id: params.user_id,
    day_number: params.day_number,
    date: params.date,
    completed: params.completed,
    value: params.value,
    synced: false,
    created_at: idx >= 0 ? existing[idx]!.created_at : new Date().toISOString(),
  };

  if (idx >= 0) {
    existing[idx] = check;
  } else {
    existing.push(check);
  }

  mmkv.setObject(key, existing);

  // Track unsynced
  addUnsyncedCheck(params.sprint_id, params.date);

  return check;
}

/**
 * Track unsynced check keys.
 */
function addUnsyncedCheck(sprintId: string, date: string): void {
  const unsynced = getUnsyncedCheckKeys();
  const key = `${sprintId}:${date}`;
  if (!unsynced.includes(key)) {
    unsynced.push(key);
    mmkv.setObject(STORAGE_KEYS.UNSYNCED_CHECKS, unsynced);
  }
}

/**
 * Get all unsynced check keys.
 */
export function getUnsyncedCheckKeys(): string[] {
  return mmkv.getObject<string[]>(STORAGE_KEYS.UNSYNCED_CHECKS) ?? [];
}

/**
 * Remove a key from unsynced checks.
 */
function removeUnsyncedCheck(key: string): void {
  const unsynced = getUnsyncedCheckKeys().filter((k) => k !== key);
  mmkv.setObject(STORAGE_KEYS.UNSYNCED_CHECKS, unsynced);
}

// ──────────── Supabase Sync Layer ────────────

/**
 * Fetch checks from Supabase for a given sprint + date.
 */
export async function fetchRemoteChecks(
  sprintId: string,
  date: string,
): Promise<DailyCheck[]> {
  const { data, error } = await supabase
    .from('daily_checks')
    .select('*')
    .eq('sprint_id', sprintId)
    .eq('date', date);

  if (error) throw error;
  return (data as DailyCheck[]) ?? [];
}

/**
 * Fetch all checks for a sprint (for history/streak views).
 */
export async function fetchAllChecksForSprint(
  sprintId: string,
): Promise<DailyCheck[]> {
  const { data, error } = await supabase
    .from('daily_checks')
    .select('*')
    .eq('sprint_id', sprintId)
    .order('day_number', { ascending: true });

  if (error) throw error;
  return (data as DailyCheck[]) ?? [];
}

/**
 * Push a single local check to Supabase.
 * Uses upsert with ON CONFLICT on (sprint_id, rule_id, date).
 */
export async function pushCheckToSupabase(check: LocalCheck): Promise<void> {
  const insert: DailyCheckInsert = {
    sprint_id: check.sprint_id,
    rule_id: check.rule_id,
    user_id: check.user_id,
    day_number: check.day_number,
    date: check.date,
    completed: check.completed,
    value: check.value,
    synced: true,
  };

  // Use id only if it's a real UUID (not local_*)
  if (!check.id.startsWith('local_')) {
    insert.id = check.id;
  }

  const { error } = await supabase
    .from('daily_checks')
    .upsert(insert, { onConflict: 'sprint_id,rule_id,date' });

  if (error) throw error;
}

/**
 * Sync all unsynced checks to Supabase.
 * Returns the number of synced records.
 */
export async function syncUnsyncedChecks(): Promise<number> {
  const keys = getUnsyncedCheckKeys();
  let syncedCount = 0;

  for (const key of keys) {
    const [sprintId, date] = key.split(':');
    if (!sprintId || !date) continue;

    const localChecks = getLocalChecks(sprintId, date);
    const unsynced = localChecks.filter((c) => !c.synced);

    let allSynced = true;
    for (const check of unsynced) {
      try {
        await pushCheckToSupabase(check);
        check.synced = true;
        syncedCount++;
      } catch {
        allSynced = false;
      }
    }

    // Update MMKV with synced flags
    mmkv.setObject(getLocalKey(sprintId, date), localChecks);

    if (allSynced) {
      removeUnsyncedCheck(key);
    }
  }

  return syncedCount;
}
