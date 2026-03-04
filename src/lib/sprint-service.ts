import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Sprint = Database['public']['Tables']['sprints']['Row'];
type SprintInsert = Database['public']['Tables']['sprints']['Insert'];

/**
 * Get the currently active sprint for the user (most recent).
 */
export async function getActiveSprint(): Promise<Sprint | null> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Sprint | null;
}

/**
 * Get all active sprints for the user, ordered by start_date ascending.
 * Returns up to 3 (the product limit).
 */
export async function getActiveSprints(): Promise<Sprint[]> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: true })
    .limit(3);

  if (error) throw error;
  return (data as Sprint[]) ?? [];
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

  // Max 3 active sprints (PRO enforcement can be added later)
  if ((count ?? 0) >= 3) {
    throw new Error('You can have up to 3 active sprints at a time. Complete or abandon one first.');
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
 * Counts from the actual start_date, handling timezone correctly.
 */
export function getSprintDayNumber(sprint: Sprint): number {
  // Parse date string as local date (YYYY-MM-DD → local midnight)
  const [sy, sm, sd] = sprint.start_date.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const today = new Date();
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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
