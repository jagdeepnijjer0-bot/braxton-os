import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

export default function ResetPasswordScreen() {
  const { updatePassword, isPasswordRecovery } = useAuth();
  const [password, setPassword]               = useState('');
  const [confirm, setConfirm]                 = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [fieldErrors, setFieldErrors]         = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError]             = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);

  // Guard: only reachable via password recovery deep link
  if (!isPasswordRecovery && !success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guardContainer}>
          <Text style={styles.guardIcon}>🔒</Text>
          <Text style={styles.guardTitle}>Invalid reset link</Text>
          <Text style={styles.guardSub}>
            This link has expired or is invalid. Request a new one from the sign in screen.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            style={{ marginTop: Layout.spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.brand}>BRAXTON</Text>
          <Text style={styles.successTitle}>Password updated</Text>
          <Text style={styles.successSub}>
            Your password has been changed. Sign in with your new password.
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            size="lg"
            style={{ marginTop: Layout.spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  function validate() {
    const e: typeof fieldErrors = {};
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Must be at least 8 characters';
    if (!confirm) e.confirm = 'Please confirm your password';
    else if (confirm !== password) e.confirm = 'Passwords do not match';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('same password')) {
        setFormError('New password must be different from your current password.');
      } else if (msg.includes('Network')) {
        setFormError('Connection error. Check your internet and try again.');
      } else {
        setFormError('Password update failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand}>BRAXTON</Text>
            <Text style={styles.title}>New password</Text>
            <Text style={styles.subtitle}>Choose a strong password for your account.</Text>
          </View>

          {formError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label="New Password"
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
            <Input
              label="Confirm Password"
              value={confirm}
              onChangeText={(t) => { setConfirm(t); setFormError(null); }}
              placeholder="Repeat your password"
              secureTextEntry={!showPassword}
              error={fieldErrors.confirm}
            />
            <Button
              title="Update Password"
              onPress={handleReset}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Layout.spacing.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.background },
  scroll:   { padding: Layout.spacing.lg, gap: Layout.spacing.xl, flexGrow: 1 },
  header:   { gap: Layout.spacing.sm },
  brand:    { fontSize: Layout.fontSize.sm, color: Colors.gold, letterSpacing: 3, fontWeight: '700' },
  title:    { fontSize: Layout.fontSize.xxxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },

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

  form:     { gap: Layout.spacing.md },
  showHide: { color: Colors.gold, fontSize: Layout.fontSize.sm, fontWeight: '600' },

  // Guard screen
  guardContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  guardIcon:  { fontSize: 48, textAlign: 'center' },
  guardTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  guardSub:   { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

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
  successSub:   { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
