import { useAddRule } from '@/hooks/use-rule-queries';
import { useCreateSprint } from '@/hooks/use-sprint-queries';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

interface RuleDraft {
  title: string;
  type: 'binary' | 'numeric';
  target_value: string;
}

const emptyRule = (): RuleDraft => ({ title: '', type: 'binary', target_value: '' });

export default function CreateSprintScreen() {
  const router = useRouter();
  const createSprint = useCreateSprint();
  const addRule = useAddRule();

  const [title, setTitle] = useState('');
  const [rules, setRules] = useState<RuleDraft[]>([emptyRule()]);
  const [loading, setLoading] = useState(false);

  const canAddRule = rules.length < 3;

  const handleAddRule = () => {
    if (canAddRule) {
      setRules((prev) => [...prev, emptyRule()]);
    }
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length > 1) {
      setRules((prev) => prev.filter((_, i) => i !== index));
    }
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

      // Add rules sequentially
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.heading}>New Sprint</Text>
        <Text style={styles.subtext}>7 days. Max 3 rules.</Text>

        <TextInput
          style={styles.input}
          placeholder="Sprint title (optional)"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />

        <Text style={styles.sectionTitle}>Rules</Text>

        {rules.map((rule, index) => (
          <View key={index} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleLabel}>Rule {index + 1}</Text>
              {rules.length > 1 ? (
                <Pressable onPress={() => handleRemoveRule(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Rule title (e.g. Exercise)"
              placeholderTextColor="#999"
              value={rule.title}
              onChangeText={(v) => updateRule(index, 'title', v)}
              editable={!loading}
            />

            <View style={styles.typeRow}>
              <Pressable
                style={[styles.typeButton, rule.type === 'binary' && styles.typeActive]}
                onPress={() => toggleRuleType(index)}
                disabled={loading}
              >
                <Text
                  style={[styles.typeText, rule.type === 'binary' && styles.typeTextActive]}
                >
                  Yes/No
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeButton, rule.type === 'numeric' && styles.typeActive]}
                onPress={() => toggleRuleType(index)}
                disabled={loading}
              >
                <Text
                  style={[styles.typeText, rule.type === 'numeric' && styles.typeTextActive]}
                >
                  Numeric
                </Text>
              </Pressable>
            </View>

            {rule.type === 'numeric' ? (
              <TextInput
                style={styles.input}
                placeholder="Target value (e.g. 10000)"
                placeholderTextColor="#999"
                value={rule.target_value}
                onChangeText={(v) => updateRule(index, 'target_value', v)}
                keyboardType="number-pad"
                editable={!loading}
              />
            ) : null}
          </View>
        ))}

        {canAddRule ? (
          <Pressable
            style={styles.addRuleButton}
            onPress={handleAddRule}
            disabled={loading}
          >
            <Text style={styles.addRuleText}>+ Add Rule</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
            loading && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Start Sprint</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 12,
  },
  ruleCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  removeText: {
    fontSize: 14,
    color: '#dc2626',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeActive: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  typeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  addRuleButton: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  addRuleText: {
    fontSize: 14,
    color: '#666',
  },
  createButton: {
    height: 48,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonPressed: {
    opacity: 0.8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
