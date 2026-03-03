import {
    addSprintRule,
    dropSprintRule,
    getSprintRules,
    updateSprintRule,
} from '@/lib/rules-service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const RULE_KEYS = {
  all: ['sprint_rules'] as const,
  bySprint: (sprintId: string) => ['sprint_rules', sprintId] as const,
};

export function useSprintRules(sprintId: string | undefined) {
  return useQuery({
    queryKey: RULE_KEYS.bySprint(sprintId ?? ''),
    queryFn: () => getSprintRules(sprintId!),
    enabled: !!sprintId,
  });
}

export function useAddRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addSprintRule,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: RULE_KEYS.bySprint(variables.sprint_id),
      });
    },
  });
}

export function useUpdateRule(sprintId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ruleId,
      params,
    }: {
      ruleId: string;
      params: Parameters<typeof updateSprintRule>[1];
    }) => updateSprintRule(ruleId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: RULE_KEYS.bySprint(sprintId),
      });
    },
  });
}

export function useDropRule(sprintId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dropSprintRule,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: RULE_KEYS.bySprint(sprintId),
      });
    },
  });
}

export { RULE_KEYS };
