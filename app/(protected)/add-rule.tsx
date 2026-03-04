/**
 * Add Rule Screen
 *
 * Single rule creation during Day 1 calibration.
 */

import {
  Button,
  Header,
  Input,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { useAddRule } from '@/hooks/use-rule-queries';
import { useTheme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function AddRuleScreen() {
  const router = useRouter();
  const { sprintId } = useLocalSearchParams<{ sprintId: string }>();
  const addRule = useAddRule();
  const { theme } = useTheme();
  const colors = theme.colors;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'binary' | 'numeric'>('binary');
  const [targetValue, setTargetValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Rule title is required.');
      return;
    }
    if (!sprintId) return;

    setLoading(true);
    try {
      await addRule.mutateAsync({
        sprint_id: sprintId,
        title: title.trim(),
        type,
        target_value:
          type === 'numeric' && targetValue
            ? parseInt(targetValue, 10)
            : undefined,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add rule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <Header title="Add Rule" />

      <View style={styles.content}>
        <Text variant="h1" style={styles.heading}>Add Rule</Text>

        <Input
          label="RULE TITLE"
          placeholder="e.g. Exercise, Read 30 min"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
          autoFocus
        />

        <View style={styles.typeSection}>
          <Text variant="label" color={colors.textSecondary} style={styles.typeLabel}>
            TYPE
          </Text>
          <SegmentedControl
            options={['Yes / No', 'Numeric']}
            selectedIndex={type === 'binary' ? 0 : 1}
            onSelect={(i) => {
              setType(i === 0 ? 'binary' : 'numeric');
              setTargetValue('');
            }}
            disabled={loading}
          />
        </View>

        {type === 'numeric' ? (
          <Input
            label="TARGET VALUE"
            placeholder="e.g. 10000"
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="number-pad"
            editable={!loading}
          />
        ) : null}
      </View>

      <View style={styles.submit}>
        <Button
          label="Add Rule"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleAdd}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  heading: {
    marginBottom: 24,
  },
  typeSection: {
    marginBottom: 16,
  },
  typeLabel: {
    letterSpacing: 1,
    marginBottom: 8,
  },
  submit: {
    marginTop: 'auto',
    paddingBottom: 8,
  },
});
