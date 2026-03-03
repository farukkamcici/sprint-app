import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Sprint = Database['public']['Tables']['sprints']['Row'];
type SprintInsert = Database['public']['Tables']['sprints']['Insert'];

/**
 * Get the currently active sprint for the user.
 */
export async function getActiveSprint(): Promise<Sprint | null> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Sprint | null;
}

/**
 * Get all sprints for the user, ordered by creation date.
 */
export async function getSprints(): Promise<Sprint[]> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Sprint[]) ?? [];
}

/**
 * Get a single sprint by ID.
 */
export async function getSprintById(id: string): Promise<Sprint | null> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Sprint | null;
}

/**
 * Create a new sprint.
 * Enforces: first sprint is always 7 days.
 * Enforces: FREE tier max 1 active sprint.
 */
export async function createSprint(params: {
  title?: string;
  category?: string;
  duration_days?: 7 | 14;
}): Promise<Sprint> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check existing active sprints
  const { count, error: countError } = await supabase
    .from('sprints')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (countError) throw countError;

  // FREE tier: max 1 active sprint (PRO enforcement can be added later)
  if ((count ?? 0) >= 1) {
    throw new Error('You already have an active sprint. Complete or abandon it first.');
  }

  // Check if this is the user's first sprint (must be 7 days)
  const { count: totalCount, error: totalError } = await supabase
    .from('sprints')
    .select('*', { count: 'exact', head: true });

  if (totalError) throw totalError;

  const isFirstSprint = (totalCount ?? 0) === 0;
  const durationDays = isFirstSprint ? 7 : (params.duration_days ?? 7);

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays - 1);

  const insert: SprintInsert = {
    user_id: user.id,
    title: params.title ?? null,
    category: params.category ?? null,
    duration_days: durationDays,
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    status: 'active',
    calibration_done: false,
  };

  const { data, error } = await supabase
    .from('sprints')
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return data as Sprint;
}

/**
 * Complete a sprint.
 */
export async function completeSprint(sprintId: string): Promise<Sprint> {
  const { data, error } = await supabase
    .from('sprints')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sprintId)
    .select()
    .single();

  if (error) throw error;
  return data as Sprint;
}

/**
 * Abandon a sprint.
 */
export async function abandonSprint(sprintId: string): Promise<Sprint> {
  const { data, error } = await supabase
    .from('sprints')
    .update({ status: 'abandoned', updated_at: new Date().toISOString() })
    .eq('id', sprintId)
    .select()
    .single();

  if (error) throw error;
  return data as Sprint;
}

/**
 * Mark calibration as done (locks rules from Day 2 onward).
 */
export async function finishCalibration(sprintId: string): Promise<Sprint> {
  const { data, error } = await supabase
    .from('sprints')
    .update({ calibration_done: true, updated_at: new Date().toISOString() })
    .eq('id', sprintId)
    .select()
    .single();

  if (error) throw error;
  return data as Sprint;
}

/**
 * Calculate the current day number of a sprint (1-indexed).
 */
export function getSprintDayNumber(sprint: Sprint): number {
  const start = new Date(sprint.start_date);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Check if today is Day 1 of the sprint (calibration window).
 */
export function isDay1(sprint: Sprint): boolean {
  return getSprintDayNumber(sprint) === 1;
}

/**
 * Check if rules can be modified (Day 1 and calibration not yet done).
 */
export function canModifyRules(sprint: Sprint): boolean {
  return isDay1(sprint) && !sprint.calibration_done;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}
