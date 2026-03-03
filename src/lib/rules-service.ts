import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type SprintRule = Database['public']['Tables']['sprint_rules']['Row'];

/**
 * Get all rules for a sprint, ordered by position.
 */
export async function getSprintRules(sprintId: string): Promise<SprintRule[]> {
  const { data, error } = await supabase
    .from('sprint_rules')
    .select('*')
    .eq('sprint_id', sprintId)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data as SprintRule[]) ?? [];
}

/**
 * Add a rule to a sprint.
 * Enforces: max 3 rules per sprint.
 */
export async function addSprintRule(params: {
  sprint_id: string;
  title: string;
  type: 'binary' | 'numeric';
  target_value?: number;
}): Promise<SprintRule> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current active rules
  const existing = await getSprintRules(params.sprint_id);
  if (existing.length >= 3) {
    throw new Error('Maximum 3 rules per sprint.');
  }

  // Find next available position
  const usedPositions = new Set(existing.map((r) => r.position));
  let nextPosition: 1 | 2 | 3 | null = null;
  for (const pos of [1, 2, 3] as const) {
    if (!usedPositions.has(pos)) {
      nextPosition = pos;
      break;
    }
  }
  if (nextPosition === null) {
    throw new Error('No available position for a new rule.');
  }

  const { data, error } = await supabase
    .from('sprint_rules')
    .insert({
      sprint_id: params.sprint_id,
      user_id: user.id,
      title: params.title.trim(),
      type: params.type,
      target_value: params.type === 'numeric' ? (params.target_value ?? null) : null,
      position: nextPosition,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SprintRule;
}

/**
 * Update a rule (only during calibration).
 */
export async function updateSprintRule(
  ruleId: string,
  params: {
    title?: string;
    type?: 'binary' | 'numeric';
    target_value?: number | null;
  },
): Promise<SprintRule> {
  const { data, error } = await supabase
    .from('sprint_rules')
    .update({
      ...params,
      title: params.title?.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)
    .select()
    .single();

  if (error) throw error;
  return data as SprintRule;
}

/**
 * Drop a rule (soft-delete: set is_active = false).
 * Only during calibration.
 */
export async function dropSprintRule(ruleId: string): Promise<void> {
  const { error } = await supabase
    .from('sprint_rules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', ruleId);

  if (error) throw error;
}
