import {
    fetchAllChecksForSprint,
    getLocalChecks,
    getTodayDate,
    saveLocalCheck,
    syncUnsyncedChecks
} from '@/lib/daily-check-service';
import {
    fetchEntriesForSprint,
    getLocalEntry,
    saveLocalEntry,
    syncUnsyncedEntries
} from '@/lib/daily-entry-service';
import type { Database } from '@/types/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type DailyCheck = Database['public']['Tables']['daily_checks']['Row'];
type DailyEntry = Database['public']['Tables']['daily_entries']['Row'];

export const DAILY_KEYS = {
  checks: (sprintId: string) => ['daily_checks', sprintId] as const,
  checksDay: (sprintId: string, date: string) =>
    ['daily_checks', sprintId, date] as const,
  allChecks: (sprintId: string) => ['daily_checks', sprintId, 'all'] as const,
  entry: (sprintId: string, dayNumber: number) =>
    ['daily_entries', sprintId, dayNumber] as const,
  allEntries: (sprintId: string) => ['daily_entries', sprintId, 'all'] as const,
};

/**
 * Get today's checks for a sprint — reads from MMKV (offline-first).
 */
export function useTodayChecks(sprintId: string | undefined) {
  const date = getTodayDate();

  return useQuery({
    queryKey: DAILY_KEYS.checksDay(sprintId ?? '', date),
    queryFn: () => getLocalChecks(sprintId!, date),
    enabled: !!sprintId,
  });
}

/**
 * Get all checks for a sprint from Supabase (for history/streaks).
 */
export function useAllChecks(sprintId: string | undefined) {
  return useQuery({
    queryKey: DAILY_KEYS.allChecks(sprintId ?? ''),
    queryFn: () => fetchAllChecksForSprint(sprintId!),
    enabled: !!sprintId,
  });
}

/**
 * Save a daily check (MMKV write-first, then invalidate query).
 */
export function useSaveCheck(sprintId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      rule_id: string;
      user_id: string;
      day_number: number;
      date: string;
      completed: boolean;
      value: number | null;
    }) =>
      Promise.resolve(
        saveLocalCheck({
          sprint_id: sprintId,
          ...params,
        }),
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: DAILY_KEYS.checksDay(sprintId, variables.date),
      });
      queryClient.invalidateQueries({
        queryKey: DAILY_KEYS.allChecks(sprintId),
      });
    },
  });
}

/**
 * Get a daily entry from MMKV (offline-first).
 */
export function useDailyEntry(
  sprintId: string | undefined,
  dayNumber: number | undefined,
) {
  return useQuery({
    queryKey: DAILY_KEYS.entry(sprintId ?? '', dayNumber ?? 0),
    queryFn: () => getLocalEntry(sprintId!, dayNumber!) ?? null,
    enabled: !!sprintId && dayNumber !== undefined && dayNumber > 0,
  });
}

/**
 * Get all entries for a sprint from Supabase.
 */
export function useAllEntries(sprintId: string | undefined) {
  return useQuery({
    queryKey: DAILY_KEYS.allEntries(sprintId ?? ''),
    queryFn: () => fetchEntriesForSprint(sprintId!),
    enabled: !!sprintId,
  });
}

/**
 * Save a daily entry (MMKV write-first).
 */
export function useSaveEntry(sprintId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      user_id: string;
      day_number: number;
      date: string;
      content: string;
    }) =>
      Promise.resolve(
        saveLocalEntry({
          sprint_id: sprintId,
          ...params,
        }),
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: DAILY_KEYS.entry(sprintId, variables.day_number),
      });
      queryClient.invalidateQueries({
        queryKey: DAILY_KEYS.allEntries(sprintId),
      });
    },
  });
}

/**
 * Trigger sync for checks.
 */
export function useSyncChecks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncUnsyncedChecks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_checks'] });
    },
  });
}

/**
 * Trigger sync for entries.
 */
export function useSyncEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncUnsyncedEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_entries'] });
    },
  });
}
