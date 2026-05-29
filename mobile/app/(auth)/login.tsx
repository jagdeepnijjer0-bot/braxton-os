import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

const AUTH_ERROR_MAP: [string, string][] = [
  ['Invalid login credentials',  'Incorrect email or password. Please try again.'],
  ['Email not confirmed',        'Please verify your email address before signing in.'],
  ['Too many requests',          'Too many attempts. Please wait a moment and try again.'],
  ['Network request failed',     'Connection error. Check your internet and try again.'],
  ['User not found',             'No account found with that email address.'],
];

function friendlyError(raw: string): string {
  for (const [key, msg] of AUTH_ERROR_MAP) {
    if (raw.includes(key)) return msg;
  }
  return raw;
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError]     = useState<string | null>(null);

  function validate() {
    const e: typeof fieldErrors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
    if (!password) e.password = 'Password is required';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setFormError(friendlyError(err?.message ?? 'Sign in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.brand}>BRAXTON</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {formError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(t) => { setEmail(t); setFormError(null); }}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={fieldErrors.email}
            />
            <View>
              <Input
                label="Password"
                value={password}
                onChangeText={(t) => { setPassword(t); setFormError(null); }}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                error={fieldErrors.password}
                rightIcon={
                  <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Layout.spacing.sm }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { padding: Layout.spacing.lg, gap: Layout.spacing.xl, flexGrow: 1 },
  backBtn: { alignSelf: 'flex-start', marginBottom: Layout.spacing.sm },
  backText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },
  header:   { gap: Layout.spacing.sm },
  brand:    { fontSize: Layout.fontSize.sm, color: Colors.gold, letterSpacing: 3, fontWeight: '700' },
  title:    { fontSize: Layout.fontSize.xxxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Layout.fontSize.base, color: Colors.textSecondary },

  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },

  form:       { gap: Layout.spacing.md },
  showHide:   { color: Colors.gold, fontSize: Layout.fontSize.sm, fontWeight: '600' },
  forgotBtn:  { alignSelf: 'flex-end', marginTop: Layout.spacing.xs },
  forgotText: { color: Colors.gold, fontSize: Layout.fontSize.sm, fontWeight: '500' },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: Layout.spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },
  footerLink: { color: Colors.gold, fontSize: Layout.fontSize.sm, fontWeight: '600' },
});
