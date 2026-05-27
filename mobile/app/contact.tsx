import React, { useState } from 'react';
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
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { ContactMessageInput } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

const RESTAURANT_PHONE = process.env.EXPO_PUBLIC_RESTAURANT_PHONE ?? '+441234567890';
const RESTAURANT_WHATSAPP = process.env.EXPO_PUBLIC_RESTAURANT_WHATSAPP ?? '+441234567890';
const RESTAURANT_INSTAGRAM = process.env.EXPO_PUBLIC_RESTAURANT_INSTAGRAM ?? 'https://instagram.com/braxton';
const RESTAURANT_FACEBOOK = process.env.EXPO_PUBLIC_RESTAURANT_FACEBOOK ?? 'https://facebook.com/braxton';
const RESTAURANT_EMAIL = process.env.EXPO_PUBLIC_RESTAURANT_EMAIL ?? 'hello@braxtonrestaurant.com';

export default function ContactScreen() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState<ContactMessageInput>({
    name: profile?.full_name ?? '',
    email: user?.email ?? '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<ContactMessageInput>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function setField<K extends keyof ContactMessageInput>(key: K, value: ContactMessageInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.message.trim()) e.message = 'Message is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSend() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || null,
        message: form.message.trim(),
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      Alert.alert('Send Failed', err.message ?? 'Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  }

  function openWhatsApp() {
    const msg = encodeURIComponent('Hello, I would like to make an enquiry about Braxton Restaurant.');
    Linking.openURL(`https://wa.me/${RESTAURANT_WHATSAPP.replace('+', '')}?text=${msg}`);
  }

  function openPhone() {
    Linking.openURL(`tel:${RESTAURANT_PHONE}`);
  }

  function openEmail() {
    Linking.openURL(`mailto:${RESTAURANT_EMAIL}`);
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successText}>
            Thank you, {form.name}! We'll get back to you at {form.email} within 24 hours.
          </Text>
          <Button title="Back to Home" onPress={() => router.replace('/(tabs)')} fullWidth size="lg" />
          <Button title="Send Another" onPress={() => setSent(false)} variant="outline" fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.tagline}>BRAXTON</Text>
            <Text style={styles.title}>Get in Touch</Text>
            <Text style={styles.subtitle}>We'd love to hear from you</Text>
          </View>

          <View style={styles.socialRow}>
            <SocialBtn emoji="📞" label="Call" onPress={openPhone} />
            <SocialBtn emoji="💬" label="WhatsApp" onPress={openWhatsApp} />
            <SocialBtn emoji="📧" label="Email" onPress={openEmail} />
            <SocialBtn emoji="📸" label="Instagram" onPress={() => Linking.openURL(RESTAURANT_INSTAGRAM)} />
            <SocialBtn emoji="👥" label="Facebook" onPress={() => Linking.openURL(RESTAURANT_FACEBOOK)} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.formTitle}>Send a Message</Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              placeholder="Your full name"
              error={errors.name}
            />
            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Phone (optional)"
              value={form.phone ?? ''}
              onChangeText={(v) => setField('phone', v)}
              placeholder="+44 7000 000000"
              keyboardType="phone-pad"
            />
            <Input
              label="Message"
              value={form.message}
              onChangeText={(v) => setField('message', v)}
              placeholder="How can we help you?"
              multiline
              numberOfLines={5}
              style={{ minHeight: 120, textAlignVertical: 'top' }}
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

          <View style={styles.addressCard}>
            <Text style={styles.addressTitle}>Find Us</Text>
            <Text style={styles.addressLine}>📍 24 Mayfair Lane, London W1J 7BX</Text>
            <Text style={styles.addressLine}>📞 {RESTAURANT_PHONE}</Text>
            <Text style={styles.addressLine}>✉️ {RESTAURANT_EMAIL}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialBtn({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.socialBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.socialEmoji}>{emoji}</Text>
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.spacing.lg, gap: Layout.spacing.lg, paddingBottom: Layout.spacing.xxxl },
  backText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },
  header: { gap: 4 },
  tagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 2, fontWeight: '600' },
  title: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  socialRow: { flexDirection: 'row', gap: Layout.spacing.sm, justifyContent: 'space-around' },
  socialBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Layout.spacing.sm,
  },
  socialEmoji: { fontSize: 20 },
  socialLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border },
  formTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  form: { gap: Layout.spacing.md },
  addressCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  addressTitle: { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  addressLine: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  successContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  successIcon: { fontSize: 56, textAlign: 'center' },
  successTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  successText: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
