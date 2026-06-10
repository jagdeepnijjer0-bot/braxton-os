import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';

const SIGNUP_ERROR_MAP: [string, string][] = [
  ['User already registered',    'AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS.'],
  ['Password should be',         'PASSWORD MUST BE AT LEAST 8 CHARACTERS.'],
  ['Network request failed',     'CONNECTION ERROR. CHECK YOUR INTERNET AND RETRY.'],
  ['Too many requests',          'TOO MANY ATTEMPTS. PLEASE WAIT AND TRY AGAIN.'],
];

function friendlyError(raw: string): string {
  for (const [key, msg] of SIGNUP_ERROR_MAP) {
    if (raw.includes(key)) return msg;
  }
  return raw.toUpperCase();
}

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [fullName, setFullName]             = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [loading, setLoading]               = useState(false);
  const [errors, setErrors]                 = useState<Record<string, string>>({});
  const [formError, setFormError]           = useState<string | null>(null);
  const [success, setSuccess]               = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  function validate() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'FULL NAME IS REQUIRED';
    if (!email.trim()) e.email = 'EMAIL IS REQUIRED';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'INVALID EMAIL ADDRESS';
    if (!password) e.password = 'PASSWORD IS REQUIRED';
    else if (password.length < 8) e.password = 'MUST BE AT LEAST 8 CHARACTERS';
    if (!confirmPassword) e.confirmPassword = 'PLEASE CONFIRM YOUR PASSWORD';
    else if (password !== confirmPassword) e.confirmPassword = 'PASSWORDS DO NOT MATCH';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function clearError(field: string) {
    setFormError(null);
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
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

  // Success screen
  if (success) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>CHECK YOUR EMAIL</Text>
          <Text style={styles.successSub}>
            WE SENT A VERIFICATION LINK TO{'\n'}
            <Text style={styles.successEmail}>{registeredEmail.toUpperCase()}</Text>
          </Text>
          <Text style={styles.successHint}>
            CLICK THE LINK TO ACTIVATE YOUR ACCOUNT. CHECK YOUR SPAM FOLDER IF YOU DON'T SEE IT.
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>BACK TO SIGN IN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={() => setSuccess(false)} activeOpacity={0.7}>
            <Text style={styles.btnGhostText}>WRONG EMAIL? GO BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.iconBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CREATE ACCOUNT</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.headerBorder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>JOIN CAFÉ LOCCO</Text>
          <Text style={styles.greetingSub}>CREATE YOUR ACCOUNT TO CONTINUE.</Text>
        </View>

        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

        <View style={styles.form}>
          {/* Full name */}
          <View>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              value={fullName}
              onChangeText={(t) => { setFullName(t); clearError('fullName'); }}
              placeholder="FULL NAME"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoComplete="name"
              selectionColor={Colors.white}
            />
            {errors.fullName && <Text style={styles.fieldError}>{errors.fullName}</Text>}
          </View>

          {/* Email */}
          <View>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={(t) => { setEmail(t); clearError('email'); }}
              placeholder="EMAIL ADDRESS"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              selectionColor={Colors.white}
            />
            {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View>
            <View style={[styles.inputRow, errors.password && styles.inputError]}>
              <TextInput
                style={styles.inputFlex}
                value={password}
                onChangeText={(t) => { setPassword(t); clearError('password'); }}
                placeholder="PASSWORD"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                selectionColor={Colors.white}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.showHide}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>

          {/* Confirm password */}
          <View>
            <View style={[styles.inputRow, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.inputFlex}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                placeholder="CONFIRM PASSWORD"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showConfirm}
                autoComplete="password-new"
                selectionColor={Colors.white}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.showHide}>{showConfirm ? 'HIDE' : 'SHOW'}</Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>
              {loading ? 'CREATING ACCOUNT...' : 'CONTINUE TO MEMBERSHIP'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            BY SIGNING UP, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ALREADY HAVE AN ACCOUNT? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { backgroundColor: Colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  headerBorder: { height: 1, backgroundColor: Colors.borderCard },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: 4,
  },
  iconBtnText: { color: Colors.textPrimary, fontSize: 22, lineHeight: 26 },

  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.lg,
    flexGrow: 1,
    paddingBottom: Layout.spacing.xxxl,
  },

  greeting: { gap: 8, paddingVertical: Layout.spacing.md },
  greetingTitle: {
    fontSize: Layout.fontSize.xxl,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.tight,
    fontWeight: '600',
  },
  greetingSub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wide,
  },

  errorBanner: {
    borderWidth: 1,
    borderColor: 'rgba(224,85,85,0.4)',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
  },
  errorBannerText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 16,
  },

  form: { gap: Layout.spacing.md },

  input: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 16,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    fontSize: Layout.fontSize.xs,
    letterSpacing: Layout.letterSpacing.tight,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 16,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    backgroundColor: Colors.background,
  },
  inputFlex: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Layout.fontSize.xs,
    letterSpacing: Layout.letterSpacing.tight,
    padding: 0,
  },
  inputError: { borderColor: Colors.error },
  fieldError: {
    fontSize: 9,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.tight,
    marginTop: 6,
    marginLeft: Layout.spacing.lg,
  },
  showHide: {
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.wider,
    marginLeft: 8,
  },

  btnPrimary: {
    paddingVertical: 18,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  btnPrimaryText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.background,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.6 },
  btnGhost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },

  terms: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 14,
    paddingHorizontal: Layout.spacing.sm,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: Layout.spacing.xl,
  },
  footerText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
  },
  footerLink: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.tight,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Success
  successContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  successTitle: {
    fontSize: Layout.fontSize.xxl,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.tight,
    fontWeight: '600',
    textAlign: 'center',
  },
  successSub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    textAlign: 'center',
    lineHeight: 18,
  },
  successEmail: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  successHint: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 14,
    paddingHorizontal: Layout.spacing.sm,
  },
});
