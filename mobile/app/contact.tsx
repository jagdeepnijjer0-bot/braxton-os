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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { ContactMessageInput } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

// ── Contact details from env — set these in your .env file ───────────────────
const PHONE     = process.env.EXPO_PUBLIC_RESTAURANT_PHONE     ?? '+441234567890';
const WHATSAPP  = process.env.EXPO_PUBLIC_RESTAURANT_WHATSAPP  ?? '+441234567890';
const EMAIL     = process.env.EXPO_PUBLIC_RESTAURANT_EMAIL     ?? 'hello@braxtonrestaurant.com';
const ADDRESS   = process.env.EXPO_PUBLIC_RESTAURANT_ADDRESS   ?? '24 Mayfair Lane, London W1J 7BX';
const INSTAGRAM = process.env.EXPO_PUBLIC_RESTAURANT_INSTAGRAM ?? 'https://instagram.com/braxton';
const TIKTOK    = process.env.EXPO_PUBLIC_RESTAURANT_TIKTOK    ?? 'https://tiktok.com/@braxton';
const FACEBOOK  = process.env.EXPO_PUBLIC_RESTAURANT_FACEBOOK  ?? 'https://facebook.com/braxton';

const BLANK_FORM: ContactMessageInput = { name: '', email: '', phone: '', message: '' };

export default function ContactScreen() {
  const { user, profile } = useAuth();

  const [form, setForm] = useState<ContactMessageInput>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<ContactMessageInput>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<ContactMessageInput | null>(null);

  // Fix: pre-fill from profile/auth once they load (both are async)
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
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.message.trim()) e.message = 'Message is required';
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
      setSubmitted({ ...form });
    } catch (err: any) {
      Alert.alert('Send Failed', err.message ?? 'Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  }

  function handleSendAnother() {
    setSubmitted(null);
    setForm({
      ...BLANK_FORM,
      name:  profile?.full_name || user?.email?.split('@')[0] || '',
      email: user?.email        || '',
    });
    setErrors({});
  }

  async function openURL(url: string) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot open link', `No app found to handle: ${url}`);
      }
    } catch {
      Alert.alert('Error', 'Could not open the link. Please try again.');
    }
  }

  function openWhatsApp() {
    const number = WHATSAPP.replace(/[^\d]/g, '');
    const text   = encodeURIComponent('Hello, I have an enquiry about Braxton Restaurant.');
    openURL(`https://wa.me/${number}?text=${text}`);
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    const preview = submitted.message.length > 80
      ? submitted.message.slice(0, 80).trimEnd() + '…'
      : submitted.message;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#0A0A1F', Colors.background]} style={styles.successHero}>
            <Text style={styles.successEmoji}>✉️</Text>
            <Text style={styles.successTitle}>Message Received</Text>
            <Text style={styles.successSubtitle}>
              We'll get back to you within 24 hours.
            </Text>
          </LinearGradient>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryBrand}>BRAXTON</Text>
              <Text style={styles.summaryLabel}>Message Summary</Text>
            </View>
            <View style={styles.summaryDivider} />
            <SummaryRow icon="👤" label="Name"    value={submitted.name} />
            <SummaryRow icon="✉️" label="Email"   value={submitted.email} />
            {submitted.phone?.trim() ? (
              <SummaryRow icon="📞" label="Phone"  value={submitted.phone} />
            ) : null}
            <SummaryRow icon="💬" label="Message" value={preview} />
            <View style={styles.replyPill}>
              <Text style={styles.replyDot}>●</Text>
              <Text style={styles.replyText}>Reply within 24 hours</Text>
            </View>
          </View>

          <View style={styles.successActions}>
            <Button
              title="Back to Home"
              onPress={() => router.replace('/(tabs)')}
              fullWidth
              size="lg"
            />
            <Button
              title="Send Another Message"
              onPress={handleSendAnother}
              variant="outline"
              fullWidth
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Contact form ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.pageHeader}>
            <Text style={styles.tagline}>BRAXTON</Text>
            <Text style={styles.title}>Get in Touch</Text>
            <Text style={styles.subtitle}>We'd love to hear from you</Text>
          </View>

          {/* ── Quick-contact row ── */}
          <View style={styles.quickRow}>
            <QuickBtn emoji="📞" label="Call"      onPress={() => openURL(`tel:${PHONE}`)} />
            <QuickBtn emoji="💬" label="WhatsApp"  onPress={openWhatsApp} />
            <QuickBtn emoji="📧" label="Email"     onPress={() => openURL(`mailto:${EMAIL}`)} />
            <QuickBtn emoji="📸" label="Instagram" onPress={() => openURL(INSTAGRAM)} />
            <QuickBtn emoji="🎵" label="TikTok"    onPress={() => openURL(TIKTOK)} />
            <QuickBtn emoji="👥" label="Facebook"  onPress={() => openURL(FACEBOOK)} />
          </View>

          <View style={styles.divider} />

          {/* ── Message form ── */}
          <Text style={styles.formTitle}>Send a Message</Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              placeholder="Your full name"
              autoComplete="name"
              error={errors.name}
            />
            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
            <Input
              label="Phone (optional)"
              value={form.phone ?? ''}
              onChangeText={(v) => setField('phone', v)}
              placeholder="+44 7000 000000"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <Input
              label="Message"
              value={form.message}
              onChangeText={(v) => setField('message', v)}
              placeholder="How can we help you?"
              multiline
              numberOfLines={5}
              style={styles.messageInput}
              error={errors.message}
            />
            <Button
              title="Send Message"
              onPress={handleSend}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          {/* ── Address card ── */}
          <View style={styles.addressCard}>
            <Text style={styles.addressTitle}>Find Us</Text>
            <Text style={styles.addressLine}>📍 {ADDRESS}</Text>
            <Text style={styles.addressLine}>📞 {PHONE}</Text>
            <Text style={styles.addressLine}>✉️ {EMAIL}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function QuickBtn({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <View style={styles.summaryRowContent}>
        <Text style={styles.summaryRowLabel}>{label}</Text>
        <Text style={styles.summaryRowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Form layout
  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxxl,
  },
  backText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },
  pageHeader: { gap: 4 },
  tagline:  { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 2, fontWeight: '600' },
  title:    { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },

  // Quick-contact row
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.spacing.sm },
  quickBtn: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: 10,
    minWidth: 58,
  },
  quickEmoji: { fontSize: 20 },
  quickLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },

  divider: { height: 1, backgroundColor: Colors.border },

  formTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  form: { gap: Layout.spacing.md },
  messageInput: { minHeight: 120, textAlignVertical: 'top' },

  addressCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  addressTitle: { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  addressLine:  { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Success screen
  successScroll: { paddingBottom: Layout.spacing.xxxl },
  successHero: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: 60,
    paddingBottom: Layout.spacing.xxl,
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  successEmoji:    { fontSize: 56 },
  successTitle:    { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  successSubtitle: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  summaryCard: {
    margin: Layout.spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    overflow: 'hidden',
  },
  summaryHeader: {
    padding: Layout.spacing.md,
    backgroundColor: 'rgba(201,168,76,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryBrand: { fontSize: Layout.fontSize.sm, color: Colors.gold, fontWeight: '800', letterSpacing: 2 },
  summaryLabel: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  summaryDivider: { height: 1, backgroundColor: Colors.border },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  summaryIcon:       { fontSize: 16, width: 20, textAlign: 'center', marginTop: 1 },
  summaryRowContent: { flex: 1 },
  summaryRowLabel:   { fontSize: Layout.fontSize.xs, color: Colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRowValue:   { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '600', marginTop: 1 },

  replyPill: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.xs, padding: Layout.spacing.md },
  replyDot:  { fontSize: 10, color: Colors.info },
  replyText: { fontSize: Layout.fontSize.xs, color: Colors.info, fontWeight: '600' },

  successActions: { paddingHorizontal: Layout.spacing.lg, gap: Layout.spacing.sm },
});
