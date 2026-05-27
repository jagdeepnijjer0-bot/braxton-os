import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ReservationInput } from '@/lib/types';
import { format, addDays } from 'date-fns';

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ReservationsScreen() {
  const { user, profile } = useAuth();

  const [form, setForm] = useState<ReservationInput>({
    name: profile?.full_name ?? '',
    email: user?.email ?? '',
    phone: profile?.phone ?? '',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '19:00',
    guests: 2,
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<ReservationInput & { form: string }>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function setField<K extends keyof ReservationInput>(key: K, value: ReservationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.time) e.time = 'Time is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('reservations').insert({
        user_id: user?.id ?? null,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        guests: form.guests,
        notes: form.notes?.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Reservation Failed', err.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Reservation Confirmed!</Text>
          <Text style={styles.successText}>
            Thank you, {form.name}! Your table for {form.guests} on{' '}
            {format(new Date(form.date), 'MMMM d, yyyy')} at {form.time} has been requested.
            We'll confirm by email shortly.
          </Text>
          <Button title="Back to Home" onPress={() => router.replace('/(tabs)')} fullWidth size="lg" />
          <Button
            title="Make Another Reservation"
            onPress={() => setSuccess(false)}
            variant="outline"
            fullWidth
          />
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
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.tagline}>BRAXTON</Text>
              <Text style={styles.title}>Reserve a Table</Text>
              <Text style={styles.subtitle}>We look forward to welcoming you</Text>
            </View>
          </View>

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
              label="Phone"
              value={form.phone}
              onChangeText={(v) => setField('phone', v)}
              placeholder="+44 7000 000000"
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <View>
              <Text style={styles.fieldLabel}>DATE</Text>
              <Input
                value={form.date}
                onChangeText={(v) => setField('date', v)}
                placeholder="YYYY-MM-DD"
                hint="Enter date in YYYY-MM-DD format"
                error={errors.date}
              />
            </View>

            <View>
              <Text style={styles.fieldLabel}>TIME SLOT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll}>
                <View style={styles.slots}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slot, form.time === slot && styles.slotActive]}
                      onPress={() => setField('time', slot)}
                    >
                      <Text style={[styles.slotText, form.time === slot && styles.slotTextActive]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text style={styles.fieldLabel}>GUESTS</Text>
              <View style={styles.guestGrid}>
                {GUEST_OPTIONS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.guestBtn, form.guests === n && styles.guestBtnActive]}
                    onPress={() => setField('guests', n)}
                  >
                    <Text style={[styles.guestBtnText, form.guests === n && styles.guestBtnTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Special Requests (optional)"
              value={form.notes ?? ''}
              onChangeText={(v) => setField('notes', v)}
              placeholder="Allergies, celebrations, seating preferences..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />

            <Button
              title="Request Reservation"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />

            <Text style={styles.note}>
              Reservations are subject to availability. You'll receive a confirmation email within 2 hours.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.spacing.lg, gap: Layout.spacing.lg, paddingBottom: Layout.spacing.xxxl },
  pageHeader: { gap: Layout.spacing.sm },
  backText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },
  headerText: { gap: 4 },
  tagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 2, fontWeight: '600' },
  title: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  form: { gap: Layout.spacing.md },
  fieldLabel: { fontSize: Layout.fontSize.xs, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  slotsScroll: { marginHorizontal: -Layout.spacing.lg },
  slots: { flexDirection: 'row', gap: Layout.spacing.sm, paddingHorizontal: Layout.spacing.lg },
  slot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  slotText: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  slotTextActive: { color: Colors.background, fontWeight: '700' },
  guestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.spacing.sm },
  guestBtn: {
    width: 52,
    height: 52,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  guestBtnText: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, fontWeight: '600' },
  guestBtnTextActive: { color: Colors.background, fontWeight: '800' },
  note: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
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
