import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from '@/hooks/useAuth';
import { ReservationInput } from '@/lib/types';
import { format, addDays, isValid, parseISO, isBefore, startOfToday } from 'date-fns';

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const INITIAL_FORM: ReservationInput = {
  name: '',
  email: '',
  phone: '',
  date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  time: '19:00',
  guests: 2,
  notes: '',
};

export default function ReservationsScreen() {
  const { user, profile } = useAuth();

  const [form, setForm] = useState<ReservationInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationInput, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<ReservationInput | null>(null);

  // Fix: pre-fill form when profile loads (it's async)
  useEffect(() => {
    if (profile || user) {
      setForm((f) => ({
        ...f,
        name: f.name || profile?.full_name || '',
        email: f.email || user?.email || '',
        phone: f.phone || profile?.phone || '',
      }));
    }
  }, [profile, user]);

  function setField<K extends keyof ReservationInput>(key: K, value: ReservationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};

    if (!form.name.trim())
      e.name = 'Full name is required';

    if (!form.email.trim())
      e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email address';

    if (!form.phone.trim())
      e.phone = 'Phone number is required';
    else if (form.phone.trim().length < 7)
      e.phone = 'Enter a valid phone number';

    if (!form.date)
      e.date = 'Date is required';
    else if (!DATE_REGEX.test(form.date))
      e.date = 'Use format YYYY-MM-DD (e.g. 2026-06-15)';
    else if (!isValid(parseISO(form.date)))
      e.date = 'That is not a valid date';
    else if (isBefore(parseISO(form.date), startOfToday()))
      e.date = 'Date must be today or in the future';

    if (!form.time)
      e.time = 'Please select a time slot';

    if (!form.guests || form.guests < 1 || form.guests > 20)
      e.guests = 'Guest count must be between 1 and 20';

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
      setSubmitted({ ...form });
    } catch (err: any) {
      Alert.alert('Reservation Failed', err.message ?? 'Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  }

  function handleNewReservation() {
    setSubmitted(null);
    setForm({
      ...INITIAL_FORM,
      name: profile?.full_name || user?.email?.split('@')[0] || '',
      email: user?.email || '',
      phone: profile?.phone || '',
    });
    setErrors({});
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    const displayDate = isValid(parseISO(submitted.date))
      ? format(parseISO(submitted.date), 'EEEE, MMMM d, yyyy')
      : submitted.date;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#0A1F0A', Colors.background]} style={styles.successHero}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>You're on the list!</Text>
            <Text style={styles.successSubtitle}>
              We'll confirm your reservation within 2 hours.
            </Text>
          </LinearGradient>

          <View style={styles.bookingCard}>
            <View style={styles.bookingCardHeader}>
              <Text style={styles.bookingCardBrand}>BRAXTON</Text>
              <Text style={styles.bookingCardLabel}>Reservation Request</Text>
            </View>
            <View style={styles.bookingDivider} />
            <BookingRow icon="👤" label="Name"   value={submitted.name} />
            <BookingRow icon="📅" label="Date"   value={displayDate} />
            <BookingRow icon="🕐" label="Time"   value={submitted.time} />
            <BookingRow icon="👥" label="Guests" value={`${submitted.guests} ${submitted.guests === 1 ? 'guest' : 'guests'}`} />
            <BookingRow icon="✉️" label="Email"  value={submitted.email} />
            {submitted.notes?.trim() ? (
              <BookingRow icon="📝" label="Notes" value={submitted.notes} />
            ) : null}
            <View style={styles.statusPill}>
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.statusText}>Pending confirmation</Text>
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
              title="Make Another Reservation"
              onPress={handleNewReservation}
              variant="outline"
              fullWidth
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
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
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.tagline}>BRAXTON</Text>
            <Text style={styles.title}>Reserve a Table</Text>
            <Text style={styles.subtitle}>We look forward to welcoming you</Text>
          </View>

          <View style={styles.form}>
            {/* ── Contact details ── */}
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
              label="Phone"
              value={form.phone}
              onChangeText={(v) => setField('phone', v)}
              placeholder="+44 7000 000000"
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone}
            />

            {/* ── Date ── */}
            <Input
              label="Date"
              value={form.date}
              onChangeText={(v) => setField('date', v)}
              placeholder="YYYY-MM-DD"
              hint="e.g. 2026-06-20 — must be today or later"
              error={errors.date}
            />

            {/* ── Time slots ── */}
            <View>
              <Text style={styles.fieldLabel}>TIME SLOT</Text>
              {errors.time && <Text style={styles.fieldError}>{errors.time}</Text>}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.slotsScroll}
              >
                <View style={styles.slots}>
                  {TIME_SLOTS.map((slot) => {
                    const active = form.time === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.slot, active && styles.slotActive]}
                        onPress={() => setField('time', slot)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.slotText, active && styles.slotTextActive]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* ── Guest count ── */}
            <View>
              <Text style={styles.fieldLabel}>GUESTS</Text>
              {errors.guests && <Text style={styles.fieldError}>{errors.guests}</Text>}
              <View style={styles.guestGrid}>
                {GUEST_OPTIONS.map((n) => {
                  const active = form.guests === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[styles.guestBtn, active && styles.guestBtnActive]}
                      onPress={() => setField('guests', n)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.guestBtnText, active && styles.guestBtnTextActive]}>
                        {n}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.largePartyBtn}
                onPress={() => router.push('/contact')}
                activeOpacity={0.75}
              >
                <Text style={styles.largePartyText}>
                  Party of 9 or more? <Text style={styles.largePartyLink}>Contact us directly →</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Notes ── */}
            <Input
              label="Special Requests (optional)"
              value={form.notes ?? ''}
              onChangeText={(v) => setField('notes', v)}
              placeholder="Allergies, celebrations, seating preferences..."
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />

            <Button
              title="Request Reservation"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />

            <Text style={styles.note}>
              Reservations are subject to availability. We'll confirm by email within 2 hours.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BookingRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.bookingRow}>
      <Text style={styles.bookingIcon}>{icon}</Text>
      <View style={styles.bookingRowContent}>
        <Text style={styles.bookingLabel}>{label}</Text>
        <Text style={styles.bookingValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // ── Form ──
  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxxl,
  },
  pageHeader: { gap: 4 },
  backText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm, marginBottom: Layout.spacing.sm },
  tagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 2, fontWeight: '700' },
  title: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },

  form: { gap: Layout.spacing.md },
  fieldLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldError: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error,
    marginBottom: 6,
  },

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

  largePartyBtn: { marginTop: Layout.spacing.sm },
  largePartyText: { fontSize: Layout.fontSize.xs, color: Colors.textMuted },
  largePartyLink: { color: Colors.gold, fontWeight: '600' },

  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  note: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

  // ── Success ──
  successScroll: { paddingBottom: Layout.spacing.xxxl },
  successHero: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: 60,
    paddingBottom: Layout.spacing.xxl,
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  successEmoji: { fontSize: 56 },
  successTitle: {
    fontSize: Layout.fontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  bookingCard: {
    margin: Layout.spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    overflow: 'hidden',
  },
  bookingCardHeader: {
    padding: Layout.spacing.md,
    backgroundColor: 'rgba(201,168,76,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingCardBrand: {
    fontSize: Layout.fontSize.sm,
    color: Colors.gold,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bookingCardLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bookingDivider: { height: 1, backgroundColor: Colors.border },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  bookingIcon: { fontSize: 16, width: 20, textAlign: 'center', marginTop: 1 },
  bookingRowContent: { flex: 1 },
  bookingLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookingValue: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    padding: Layout.spacing.md,
  },
  statusDot: { fontSize: 10, color: Colors.warning },
  statusText: { fontSize: Layout.fontSize.xs, color: Colors.warning, fontWeight: '600' },

  successActions: {
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
});
