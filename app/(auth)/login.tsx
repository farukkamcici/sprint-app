import { signIn, signUp } from '@/lib/auth';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
    // On success, auth listener in root layout handles navigation
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.inner}>
        <Text style={styles.title}>Sprint</Text>
        <Text style={styles.subtitle}>
          {isRegister ? 'Create account' : 'Sign in'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType={isRegister ? 'newPassword' : 'password'}
          editable={!loading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setIsRegister((prev) => !prev);
            setError(null);
          }}
          disabled={loading}
        >
          <Text style={styles.toggleText}>
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"}
          </Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
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
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    height: 48,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});
