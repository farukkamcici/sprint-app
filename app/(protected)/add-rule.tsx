import { useAddRule } from '@/hooks/use-rule-queries';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function AddRuleScreen() {
  const router = useRouter();
  const { sprintId } = useLocalSearchParams<{ sprintId: string }>();
  const addRule = useAddRule();

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
        target_value: type === 'numeric' && targetValue ? parseInt(targetValue, 10) : undefined,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add rule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.inner}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.heading}>Add Rule</Text>

        <TextInput
          style={styles.input}
          placeholder="Rule title"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
          autoFocus
        />

        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeButton, type === 'binary' && styles.typeActive]}
            onPress={() => setType('binary')}
            disabled={loading}
          >
            <Text style={[styles.typeText, type === 'binary' && styles.typeTextActive]}>
              Yes/No
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeButton, type === 'numeric' && styles.typeActive]}
            onPress={() => setType('numeric')}
            disabled={loading}
          >
            <Text style={[styles.typeText, type === 'numeric' && styles.typeTextActive]}>
              Numeric
            </Text>
          </Pressable>
        </View>

        {type === 'numeric' ? (
          <TextInput
            style={styles.input}
            placeholder="Target value"
            placeholderTextColor="#999"
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="number-pad"
            editable={!loading}
          />
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.8 },
            loading && { opacity: 0.5 },
          ]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addButtonText}>Add Rule</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
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
  addButton: {
    height: 48,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
