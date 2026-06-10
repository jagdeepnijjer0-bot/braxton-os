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

export default function ResetPasswordScreen() {
  const { updatePassword, isPasswordRecovery } = useAuth();
  const insets = useSafeAreaInsets();
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
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.centeredContainer}>
          <Text style={styles.guardIcon}>🔒</Text>
          <Text style={styles.guardTitle}>INVALID RESET LINK</Text>
          <Text style={styles.guardSub}>
            THIS LINK HAS EXPIRED OR IS INVALID. REQUEST A NEW ONE FROM THE SIGN IN SCREEN.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: Layout.spacing.lg }]}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>BACK TO SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.centeredContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>PASSWORD UPDATED</Text>
          <Text style={styles.successSub}>
            YOUR PASSWORD HAS BEEN CHANGED. SIGN IN WITH YOUR NEW PASSWORD.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: Layout.spacing.lg }]}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function validate() {
    const e: typeof fieldErrors = {};
    if (!password) e.password = 'PASSWORD IS REQUIRED';
    else if (password.length < 8) e.password = 'MUST BE AT LEAST 8 CHARACTERS';
    if (!confirm) e.confirm = 'PLEASE CONFIRM YOUR PASSWORD';
    else if (confirm !== password) e.confirm = 'PASSWORDS DO NOT MATCH';
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
        setFormError('NEW PASSWORD MUST BE DIFFERENT FROM YOUR CURRENT PASSWORD.');
      } else if (msg.includes('Network')) {
        setFormError('CONNECTION ERROR. CHECK YOUR INTERNET AND TRY AGAIN.');
      } else {
        setFormError('PASSWORD UPDATE FAILED. PLEASE TRY AGAIN.');
      }
    } finally {
      setLoading(false);
    }
  }

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
          <Text style={styles.headerTitle}>RESET PASSWORD</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>CHOOSE A STRONG PASSWORD FOR YOUR ACCOUNT.</Text>

          {formError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>NEW PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setFormError(null); }}
                  placeholder="MIN. 8 CHARACTERS"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.showHideBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.showHideText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={(t) => { setConfirm(t); setFormError(null); }}
                placeholder="REPEAT YOUR PASSWORD"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
              {fieldErrors.confirm ? (
                <Text style={styles.fieldError}>{fieldErrors.confirm}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled, { marginTop: Layout.spacing.sm }]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'UPDATING…' : 'UPDATE PASSWORD'}
              </Text>
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

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.full,
  },
  input: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
  },
  showHideBtn: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  showHideText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
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

  // Guard / centered states
  centeredContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  guardIcon: { fontSize: 48, textAlign: 'center' },
  guardTitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },
  guardSub: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Success screen
  successIcon: {
    fontSize: 52,
    color: Colors.success,
    textAlign: 'center',
    fontWeight: '300',
  },
  successTitle: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },
  successSub: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: Layout.letterSpacing.wider,
  },
});
