import {
    abandonSprint,
    completeSprint,
    createSprint,
    finishCalibration,
    getActiveSprint,
    getSprints,
} from '@/lib/sprint-service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const SPRINT_KEYS = {
  all: ['sprints'] as const,
  active: ['sprints', 'active'] as const,
  list: ['sprints', 'list'] as const,
};

export function useActiveSprint() {
  return useQuery({
    queryKey: SPRINT_KEYS.active,
    queryFn: getActiveSprint,
  });
}

export function useSprintList() {
  return useQuery({
    queryKey: SPRINT_KEYS.list,
    queryFn: getSprints,
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPRINT_KEYS.all });
    },
  });
}

export function useCompleteSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPRINT_KEYS.all });
    },
  });
}

export function useAbandonSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: abandonSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPRINT_KEYS.all });
    },
  });
}

export function useFinishCalibration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: finishCalibration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPRINT_KEYS.all });
    },
  });
}

export { SPRINT_KEYS };
