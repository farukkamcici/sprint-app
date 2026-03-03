import {
    getAllSprints,
    getSprintHistory,
} from '@/lib/streak-service';
import { useQuery } from '@tanstack/react-query';

export const HISTORY_KEYS = {
  history: (limit: number) => ['sprint_history', limit] as const,
  allSprints: ['sprints', 'all_for_streak'] as const,
};

/**
 * Get sprint history (last N non-active sprints).
 * FREE tier: limit 3.
 */
export function useSprintHistory(limit: number = 3) {
  return useQuery({
    queryKey: HISTORY_KEYS.history(limit),
    queryFn: () => getSprintHistory(limit),
  });
}

/**
 * Get all sprints for streak calculation.
 */
export function useAllSprints() {
  return useQuery({
    queryKey: HISTORY_KEYS.allSprints,
    queryFn: getAllSprints,
  });
}
