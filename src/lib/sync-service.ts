import { syncUnsyncedChecks } from '@/lib/daily-check-service';
import { syncUnsyncedEntries } from '@/lib/daily-entry-service';

/**
 * Background sync service.
 * Pushes all unsynced daily checks and entries to Supabase.
 */
export async function syncAll(): Promise<{ checks: number; entries: number }> {
  const [checks, entries] = await Promise.all([
    syncUnsyncedChecks(),
    syncUnsyncedEntries(),
  ]);

  return { checks, entries };
}
