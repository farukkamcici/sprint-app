import type { Database } from '@/types/database';
import { create } from 'zustand';

type Sprint = Database['public']['Tables']['sprints']['Row'];
type SprintRule = Database['public']['Tables']['sprint_rules']['Row'];

interface SprintState {
  activeSprint: Sprint | null;
  rules: SprintRule[];

  setActiveSprint: (sprint: Sprint | null) => void;
  setRules: (rules: SprintRule[]) => void;
  reset: () => void;
}

export const useSprintStore = create<SprintState>((set) => ({
  activeSprint: null,
  rules: [],

  setActiveSprint: (activeSprint) => set({ activeSprint }),
  setRules: (rules) => set({ rules }),

  reset: () =>
    set({
      activeSprint: null,
      rules: [],
    }),
}));
