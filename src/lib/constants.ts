/**
 * MMKV storage keys used throughout the app.
 * Centralized to prevent key collisions.
 */
export const STORAGE_KEYS = {
  // Auth
  AUTH_SESSION: 'auth.session',

  // Offline daily checks: daily_checks:{sprint_id}:{date}
  dailyChecks: (sprintId: string, date: string) =>
    `daily_checks:${sprintId}:${date}`,

  // Offline daily entries: daily_entries:{sprint_id}:{day_number}
  dailyEntry: (sprintId: string, dayNumber: number) =>
    `daily_entries:${sprintId}:${dayNumber}`,

  // List of unsynced record IDs
  UNSYNCED_CHECKS: 'sync.unsynced_checks',
  UNSYNCED_ENTRIES: 'sync.unsynced_entries',

  // Design system
  THEME_MODE: 'app.theme_mode',
  ONBOARDING_COMPLETE: 'app.onboarding_complete',
} as const;
