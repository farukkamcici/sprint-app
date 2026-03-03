import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type DailyCheck = Database['public']['Tables']['daily_checks']['Row'];
type Sprint = Database['public']['Tables']['sprints']['Row'];

/**
 * Calculate the current daily streak for a sprint.
 * A streak is the number of consecutive days (ending today or yesterday)
 * where ALL active rules were completed.
 *
 * Returns streak count as a simple number.
 */
export function calculateDailyStreak(
  checks: DailyCheck[],
  totalRules: number,
  currentDayNumber: number,
): number {
  if (totalRules === 0 || checks.length === 0) return 0;

  // Group checks by day_number
  const dayMap = new Map<number, DailyCheck[]>();
  for (const check of checks) {
    const existing = dayMap.get(check.day_number) ?? [];
    existing.push(check);
    dayMap.set(check.day_number, existing);
  }

  let streak = 0;

  // Walk backwards from the current day (or the last completed day)
  for (let day = currentDayNumber; day >= 1; day--) {
    const dayChecks = dayMap.get(day);
    if (!dayChecks) {
      // If we haven't checked day yet and it's today, skip to yesterday
      if (day === currentDayNumber) continue;
      break;
    }

    const completedCount = dayChecks.filter((c) => c.completed).length;
    if (completedCount >= totalRules) {
      streak++;
    } else {
      // If today is incomplete, don't break yet — check if yesterday started the streak
      if (day === currentDayNumber) continue;
      break;
    }
  }

  return streak;
}

/**
 * Calculate the sprint streak — number of consecutively completed sprints.
 */
export function calculateSprintStreak(sprints: Sprint[]): number {
  // Sort by end_date descending
  const sorted = [...sprints]
    .filter((s) => s.status !== 'active')
    .sort((a, b) => b.end_date.localeCompare(a.end_date));

  let streak = 0;
  for (const sprint of sorted) {
    if (sprint.status === 'completed') {
      streak++;
    } else {
      break; // abandoned breaks the streak
    }
  }

  return streak;
}

/**
 * Get sprint history from Supabase (non-active sprints).
 * FREE tier: last 3 sprints.
 */
export async function getSprintHistory(
  limit: number = 3,
): Promise<Sprint[]> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .neq('status', 'active')
    .order('end_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as Sprint[]) ?? [];
}

/**
 * Get all sprints (for streak calculation).
 */
export async function getAllSprints(): Promise<Sprint[]> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Sprint[]) ?? [];
}

/**
 * Calculate completion rate for a sprint (percentage of checks completed).
 */
export function calculateCompletionRate(
  checks: DailyCheck[],
  totalRules: number,
  totalDays: number,
): number {
  if (totalRules === 0 || totalDays === 0) return 0;
  const totalPossible = totalRules * totalDays;
  const completed = checks.filter((c) => c.completed).length;
  return Math.round((completed / totalPossible) * 100);
}
