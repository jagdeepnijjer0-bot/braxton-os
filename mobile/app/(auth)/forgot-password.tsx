import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError]   = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);

  function validate() {
    if (!email.trim()) { setEmailError('EMAIL IS REQUIRED'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('INVALID EMAIL ADDRESS'); return false; }
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
        setFormError('CONNECTION ERROR. CHECK YOUR INTERNET AND TRY AGAIN.');
      } else if (msg.includes('Too many')) {
        setFormError('TOO MANY REQUESTS. PLEASE WAIT A MOMENT AND TRY AGAIN.');
      } else {
        setFormError('SOMETHING WENT WRONG. PLEASE TRY AGAIN.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Sent confirmation screen ───────────────────────────────────────────────
  if (sent) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FORGOT PASSWORD</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.sentContainer}>
          <Text style={styles.sentTitle}>RESET LINK SENT</Text>

          <View style={styles.sentCard}>
            <Text style={styles.sentBody}>
              IF AN ACCOUNT EXISTS FOR{'\n'}
              <Text style={styles.sentEmail}>{email.trim().toUpperCase()}</Text>
              {'\n'}YOU'LL RECEIVE A PASSWORD RESET LINK SHORTLY.
            </Text>
            <Text style={styles.sentHint}>
              CHECK YOUR SPAM FOLDER IF YOU DON'T SEE IT. THE LINK EXPIRES IN 1 HOUR.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: Layout.spacing.md }]}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>BACK TO SIGN IN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tryAgainBtn}
            onPress={() => setSent(false)}
          >
            <Text style={styles.tryAgainText}>TRY A DIFFERENT EMAIL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Request form ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FORGOT PASSWORD</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            ENTER YOUR EMAIL ADDRESS AND WE'LL SEND YOU A LINK TO RESET YOUR PASSWORD.
          </Text>

          {formError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(null); setFormError(null); }}
                placeholder="YOUR@EMAIL.COM"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              {emailError ? (
                <Text style={styles.fieldError}>{emailError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'SENDING…' : 'SEND RESET LINK'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>REMEMBERED IT? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>SIGN IN</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  kav:  { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    height: Layout.headerHeight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCard,
  },
  headerSide: { width: 44, alignItems: 'flex-start' },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },

  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.lg,
    flexGrow: 1,
  },

  subtitle: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.wider,
    lineHeight: 18,
  },

  errorBanner: {
    backgroundColor: 'rgba(224,85,85,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224,85,85,0.3)',
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.md,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: Layout.fontSize.xs,
    letterSpacing: Layout.letterSpacing.wider,
    lineHeight: 18,
  },

  form: { gap: Layout.spacing.md },

  fieldGroup: { gap: Layout.spacing.sm },

  label: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
    paddingHorizontal: Layout.spacing.sm,
  },

  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.error,
  },

  fieldError: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.wider,
    paddingHorizontal: Layout.spacing.sm,
  },

  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: Colors.background,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: Layout.spacing.xl,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: Layout.fontSize.xs,
    letterSpacing: Layout.letterSpacing.wider,
  },
  footerLink: {
    color: Colors.textPrimary,
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Sent state
  sentContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  sentTitle: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },
  sentCard: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  sentBody: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: Layout.letterSpacing.wider,
  },
  sentEmail: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  sentHint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: Layout.letterSpacing.wider,
  },
  tryAgainBtn: { marginTop: Layout.spacing.xs },
  tryAgainText: {
    color: Colors.textMuted,
    fontSize: Layout.fontSize.xs,
    letterSpacing: Layout.letterSpacing.wider,
    textDecorationLine: 'underline',
  },
});
