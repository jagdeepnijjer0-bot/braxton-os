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

const AUTH_ERROR_MAP: [string, string][] = [
  ['Invalid login credentials',  'INCORRECT EMAIL OR PASSWORD. PLEASE TRY AGAIN.'],
  ['Email not confirmed',        'PLEASE VERIFY YOUR EMAIL BEFORE SIGNING IN.'],
  ['Too many requests',          'TOO MANY ATTEMPTS. PLEASE WAIT AND TRY AGAIN.'],
  ['Network request failed',     'CONNECTION ERROR. CHECK YOUR INTERNET AND RETRY.'],
  ['User not found',             'NO ACCOUNT FOUND WITH THAT EMAIL ADDRESS.'],
];

function friendlyError(raw: string): string {
  for (const [key, msg] of AUTH_ERROR_MAP) {
    if (raw.includes(key)) return msg;
  }
  return raw.toUpperCase();
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError]       = useState<string | null>(null);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'EMAIL IS REQUIRED';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'INVALID EMAIL ADDRESS';
    if (!password) e.password = 'PASSWORD IS REQUIRED';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      setFormError(friendlyError(err?.message ?? 'Sign in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>MEMBER LOGIN</Text>
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
          <Text style={styles.greetingTitle}>WELCOME BACK</Text>
          <Text style={styles.greetingSub}>LOG IN TO ACCESS YOUR MEMBERSHIP.</Text>
        </View>

        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

        <View style={styles.form}>
          {/* Email */}
          <View>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={(t) => { setEmail(t); setFormError(null); setErrors((e) => ({ ...e, email: undefined })); }}
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
                onChangeText={(t) => { setPassword(t); setFormError(null); setErrors((e) => ({ ...e, password: undefined })); }}
                placeholder="PASSWORD"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoComplete="password"
                selectionColor={Colors.white}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.showHide}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>{loading ? 'SIGNING IN...' : 'LOG IN'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DON'T HAVE AN ACCOUNT? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>SIGN UP</Text>
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

  greeting: { gap: 8, paddingVertical: Layout.spacing.lg },
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

  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: {
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.wider,
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
});
