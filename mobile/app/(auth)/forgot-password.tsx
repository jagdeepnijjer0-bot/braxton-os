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

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail]         = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);

  function validate() {
    if (!email.trim()) { setEmailError('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Invalid email address'); return false; }
    setEmailError(null);
    return true;
  }

  async function handleSend() {
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('Network')) {
        setFormError('Connection error. Check your internet and try again.');
      } else if (msg.includes('Too many')) {
        setFormError('Too many requests. Please wait a moment and try again.');
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Sent confirmation screen ───────────────────────────────────────────────
  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.sentContainer}>
          <Text style={styles.sentIcon}>📬</Text>
          <Text style={styles.brand}>BRAXTON</Text>
          <Text style={styles.sentTitle}>Reset link sent</Text>
          <Text style={styles.sentBody}>
            If an account exists for{'\n'}
            <Text style={styles.sentEmail}>{email.trim()}</Text>
            {'\n'}you'll receive a password reset link shortly.
          </Text>
          <Text style={styles.sentHint}>
            Check your spam folder if you don't see it. The link expires in 1 hour.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            size="lg"
            style={{ marginTop: Layout.spacing.xl }}
          />
          <TouchableOpacity onPress={() => setSent(false)} style={styles.tryAgainBtn}>
            <Text style={styles.tryAgainText}>Try a different email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Request form ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.brand}>BRAXTON</Text>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
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
              onChangeText={(t) => { setEmail(t); setEmailError(null); setFormError(null); }}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError ?? undefined}
            />
            <Button
              title="Send Reset Link"
              onPress={handleSend}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Layout.spacing.sm }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered it? </Text>
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
  footer:   { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: Layout.spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },
  footerLink: { color: Colors.gold, fontSize: Layout.fontSize.sm, fontWeight: '600' },

  // Sent screen
  sentContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
    backgroundColor: Colors.background,
  },
  sentIcon:  { fontSize: 52, textAlign: 'center' },
  sentTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  sentBody:  { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  sentEmail: { color: Colors.gold, fontWeight: '600' },
  sentHint:  { fontSize: Layout.fontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: Layout.spacing.sm },
  tryAgainBtn: { marginTop: Layout.spacing.sm },
  tryAgainText: { color: Colors.textMuted, fontSize: Layout.fontSize.sm },
});
