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

const SIGNUP_ERROR_MAP: [string, string][] = [
  ['User already registered',    'An account with this email already exists. Try signing in.'],
  ['Password should be',         'Password must be at least 8 characters.'],
  ['Network request failed',     'Connection error. Check your internet and try again.'],
  ['Too many requests',          'Too many attempts. Please wait a moment and try again.'],
];

function friendlyError(raw: string): string {
  for (const [key, msg] of SIGNUP_ERROR_MAP) {
    if (raw.includes(key)) return msg;
  }
  return raw;
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [formError, setFormError]     = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  function validate() {
    const e: typeof fieldErrors = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Must be at least 8 characters';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup() {
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      setRegisteredEmail(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setFormError(friendlyError(err?.message ?? 'Sign up failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  // ── Email verification success screen ──────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={styles.brand}>BRAXTON</Text>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successBody}>
            We sent a verification link to{'\n'}
            <Text style={styles.successEmail}>{registeredEmail}</Text>
          </Text>
          <Text style={styles.successHint}>
            Click the link in the email to activate your account. Check your spam folder if you don't see it within a minute.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            size="lg"
            style={{ marginTop: Layout.spacing.xl }}
          />
          <TouchableOpacity onPress={() => setSuccess(false)} style={styles.resendBtn}>
            <Text style={styles.resendText}>Wrong email? Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.brand}>BRAXTON</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join us for an exclusive dining experience</Text>
          </View>

          {formError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={(t) => { setFullName(t); setFormError(null); }}
              placeholder="John Doe"
              autoComplete="name"
              error={fieldErrors.fullName}
            />
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
            <Input
              label="Password"
              value={password}
              onChangeText={(t) => { setPassword(t); setFormError(null); }}
              placeholder="Min. 8 characters"
              secureTextEntry={!showPassword}
              error={fieldErrors.password}
              hint="At least 8 characters"
              rightIcon={
                <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />
            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Layout.spacing.sm }}
            />
            <Text style={styles.terms}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
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
  terms:      { fontSize: Layout.fontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  termsLink:  { color: Colors.gold },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: Layout.spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },
  footerLink: { color: Colors.gold, fontSize: Layout.fontSize.sm, fontWeight: '600' },

  // Success screen
  successContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
    backgroundColor: Colors.background,
  },
  successIcon:  { fontSize: 52, textAlign: 'center' },
  successTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  successBody:  { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  successEmail: { color: Colors.gold, fontWeight: '600' },
  successHint:  { fontSize: Layout.fontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: Layout.spacing.sm },
  resendBtn:    { marginTop: Layout.spacing.sm },
  resendText:   { color: Colors.textMuted, fontSize: Layout.fontSize.sm },
});
