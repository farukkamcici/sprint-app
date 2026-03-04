/**
 * Create Sprint Screen
 *
 * Sprint creation flow: optional title, 1-3 rules.
 * Clean card-based rule builder. Premium form UX.
 */

import {
    Button,
    Card,
    Header,
    Input,
    Screen,
    SegmentedControl,
    Text,
} from '@/components/ui';
import { useAddRule } from '@/hooks/use-rule-queries';
import { useCreateSprint } from '@/hooks/use-sprint-queries';
import { useTheme } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

interface RuleDraft {
  title: string;
  type: 'binary' | 'numeric';
  target_value: string;
}

const emptyRule = (): RuleDraft => ({
  title: '',
  type: 'binary',
  target_value: '',
});

export default function CreateSprintScreen() {
  const router = useRouter();
  const createSprint = useCreateSprint();
  const addRule = useAddRule();
  const { theme } = useTheme();
  const colors = theme.colors;

  const [title, setTitle] = useState('');
  const [rules, setRules] = useState<RuleDraft[]>([emptyRule()]);
  const [loading, setLoading] = useState(false);

  const canAddRule = rules.length < 3;

  const handleAddRule = () => {
    if (canAddRule) setRules((prev) => [...prev, emptyRule()]);
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length > 1) setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof RuleDraft, value: string) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const toggleRuleType = (index: number) => {
    setRules((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, type: r.type === 'binary' ? 'numeric' : 'binary', target_value: '' }
          : r,
      ),
    );
  };

  const handleCreate = async () => {
    const validRules = rules.filter((r) => r.title.trim());
    if (validRules.length === 0) {
      Alert.alert('Error', 'Add at least one rule.');
      return;
    }
    setLoading(true);
    try {
      const sprint = await createSprint.mutateAsync({
        title: title.trim() || undefined,
      });
      for (const rule of validRules) {
        await addRule.mutateAsync({
          sprint_id: sprint.id,
          title: rule.title.trim(),
          type: rule.type,
          target_value:
            rule.type === 'numeric' && rule.target_value
              ? parseInt(rule.target_value, 10)
              : undefined,
        });
      }
      router.replace('/(protected)/home');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create sprint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard>
      <Header title="New Sprint" />

      <View style={styles.intro}>
        <Text variant="h1">New Sprint</Text>
        <Text variant="small" color={colors.textSecondary} style={styles.subtext}>
          7 days. Max 3 rules. Lock in and execute.
        </Text>
      </View>

      <Input
        label="SPRINT TITLE"
        placeholder="Optional — e.g. Week of Focus"
        value={title}
        onChangeText={setTitle}
        editable={!loading}
      />

      {/* Rules */}
      <View style={styles.rulesSection}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
          RULES
        </Text>

        {rules.map((rule, index) => (
          <Card key={index} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text variant="caption" color={colors.textMuted}>
                RULE {index + 1}
              </Text>
              {rules.length > 1 ? (
                <Pressable onPress={() => handleRemoveRule(index)} hitSlop={8}>
                  <Text variant="smallMedium" color={colors.error}>
                    Remove
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Input
              placeholder="e.g. Exercise, Read, No social media"
              value={rule.title}
              onChangeText={(v) => updateRule(index, 'title', v)}
              editable={!loading}
            />

            <SegmentedControl
              options={['Yes / No', 'Numeric']}
              selectedIndex={rule.type === 'binary' ? 0 : 1}
              onSelect={() => toggleRuleType(index)}
              disabled={loading}
            />

            {rule.type === 'numeric' ? (
              <Input
                placeholder="Target value — e.g. 10000"
                value={rule.target_value}
                onChangeText={(v) => updateRule(index, 'target_value', v)}
                keyboardType="number-pad"
                editable={!loading}
                containerStyle={styles.targetInput}
              />
            ) : null}
          </Card>
        ))}

        {canAddRule ? (
          <Pressable
            style={[
              styles.addRuleButton,
              {
                borderColor: colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
            onPress={handleAddRule}
            disabled={loading}
          >
            <Text variant="smallMedium" color={colors.textMuted}>
              + Add Rule
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Submit */}
      <View style={styles.submitSection}>
        <Button
          label="Start Sprint"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleCreate}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: 28,
  },
  subtext: {
    marginTop: 6,
  },
  rulesSection: {
    marginTop: 8,
    gap: 12,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  ruleCard: {
    gap: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetInput: {
    marginTop: 4,
    marginBottom: 0,
  },
  addRuleButton: {
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitSection: {
    marginTop: 32,
    paddingBottom: 8,
  },
});
