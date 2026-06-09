import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';
import { supabase } from '@/lib/supabase';
import { ContactMessageInput } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

const EMAIL   = process.env.EXPO_PUBLIC_RESTAURANT_EMAIL ?? 'info@cafelocco.co.uk';
const PHONE   = process.env.EXPO_PUBLIC_RESTAURANT_PHONE ?? '';
const WHATSAPP  = process.env.EXPO_PUBLIC_RESTAURANT_WHATSAPP ?? '';

const BLANK: ContactMessageInput = { name: '', email: '', phone: '', message: '' };

export default function ContactScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, profile } = useAuth();

  const [form, setForm] = useState<ContactMessageInput>(BLANK);
  const [errors, setErrors] = useState<Partial<ContactMessageInput>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile || user) {
      setForm((f) => ({
        ...f,
        name:  f.name  || profile?.full_name || '',
        email: f.email || user?.email        || '',
      }));
    }
  }, [profile, user]);

  function setField<K extends keyof ContactMessageInput>(key: K, value: ContactMessageInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name.trim())    e.name    = 'FIRST NAME IS REQUIRED';
    if (!form.email.trim())   e.email   = 'EMAIL IS REQUIRED';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'PLEASE ENTER A VALID EMAIL';
    if (!form.message.trim()) e.message = 'MESSAGE IS REQUIRED';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSend() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone?.trim() || null,
        message: form.message.trim(),
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('SEND FAILED', err.message ?? 'Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  }

  async function openURL(url: string) {
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
  }

  // Success state
  if (success) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="CONTACT US" onMenuPress={() => setDrawerOpen(true)} />
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>MESSAGE SENT SUCCESSFULLY</Text>
            <Text style={styles.successSub}>WE'LL BE IN TOUCH WITHIN 24 HOURS.</Text>
          </View>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>BACK TO HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => { setSuccess(false); setForm({ ...BLANK, name: profile?.full_name || '', email: user?.email || '' }); }}
            activeOpacity={0.8}
          >
            <Text style={styles.btnOutlineText}>SEND ANOTHER MESSAGE</Text>
          </TouchableOpacity>
        </View>
        <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="CONTACT US" onMenuPress={() => setDrawerOpen(true)} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form card */}
          <View style={styles.formCard}>
            <FormField
              value={form.name}
              onChangeText={(t) => setField('name', t)}
              placeholder="FIRST NAME"
              error={errors.name}
            />
            <FormField
              value={form.email}
              onChangeText={(t) => setField('email', t)}
              placeholder="EMAIL ADDRESS"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <FormField
              value={form.phone ?? ''}
              onChangeText={(t) => setField('phone', t)}
              placeholder="CONTACT NUMBER"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.textarea}
              value={form.message}
              onChangeText={(t) => setField('message', t)}
              placeholder="MESSAGE"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              selectionColor={Colors.white}
            />
            {errors.message && <Text style={styles.fieldError}>{errors.message}</Text>}

            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendBtnText}>{loading ? 'SENDING...' : 'SEND MESSAGE'}</Text>
            </TouchableOpacity>
          </View>

          {/* Email card */}
          <View style={styles.emailCard}>
            <Text style={styles.emailLabel}>EMAIL US AT</Text>
            <TouchableOpacity onPress={() => openURL(`mailto:${EMAIL}`)} activeOpacity={0.7}>
              <Text style={styles.emailAddress}>{EMAIL.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Phone quick links */}
          {(PHONE || WHATSAPP) && (
            <View style={styles.quickRow}>
              {PHONE    ? <QuickLink label="CALL US"    onPress={() => openURL(`tel:${PHONE}`)} /> : null}
              {WHATSAPP ? <QuickLink label="WHATSAPP" onPress={() => openURL(`https://wa.me/${WHATSAPP.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Hello, I have an enquiry.')}`)} /> : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function FormField({
  value, onChangeText, placeholder, keyboardType, autoCapitalize, error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
}) {
  return (
    <View>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        selectionColor={Colors.white}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function QuickLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickLink} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickLinkText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxxl,
  },

  // Form card
  formCard: {
    borderWidth: 2,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
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
  textarea: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 14,
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    fontSize: Layout.fontSize.xs,
    letterSpacing: Layout.letterSpacing.tight,
    minHeight: 120,
  },
  inputError: { borderColor: Colors.error },
  fieldError: {
    fontSize: 9,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.tight,
    marginLeft: Layout.spacing.lg,
    marginTop: 4,
  },
  sendBtn: {
    paddingVertical: 16,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCardStrong,
    alignItems: 'center',
    marginTop: 8,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },

  // Email card
  emailCard: {
    borderWidth: 2,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  emailLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },
  emailAddress: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.tight,
    fontWeight: '600',
  },

  // Quick links
  quickRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  quickLink: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    alignItems: 'center',
  },
  quickLinkText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Success
  successContainer: {
    flex: 1,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    justifyContent: 'center',
  },
  successCard: {
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
    textAlign: 'center',
  },
  successSub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    textAlign: 'center',
  },
  btnPrimary: {
    paddingVertical: 18,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.background,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
  },
  btnOutline: {
    paddingVertical: 18,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    alignItems: 'center',
  },
  btnOutlineText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
});
