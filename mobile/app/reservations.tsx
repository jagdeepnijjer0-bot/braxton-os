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
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ReservationInput } from '@/lib/types';
import { format, addDays, isValid, parseISO, isBefore, startOfToday } from 'date-fns';

const TIME_SLOTS = [
  '9:00', '9:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, profile } = useAuth();

  const [form, setForm] = useState<ReservationInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationInput, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<ReservationInput | null>(null);

  useEffect(() => {
    if (profile || user) {
      setForm((f) => ({
        ...f,
        name:  f.name  || profile?.full_name || '',
        email: f.email || user?.email        || '',
        phone: f.phone || profile?.phone     || '',
      }));
    }
  }, [profile, user]);

  function setField<K extends keyof ReservationInput>(key: K, value: ReservationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name.trim())   e.name  = 'FULL NAME IS REQUIRED';
    if (!form.email.trim())  e.email = 'EMAIL IS REQUIRED';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'ENTER A VALID EMAIL ADDRESS';
    if (!form.phone.trim())  e.phone = 'PHONE NUMBER IS REQUIRED';
    else if (form.phone.trim().length < 7) e.phone = 'ENTER A VALID PHONE NUMBER';
    if (!form.date)          e.date  = 'DATE IS REQUIRED';
    else if (!DATE_REGEX.test(form.date)) e.date = 'USE FORMAT YYYY-MM-DD';
    else if (!isValid(parseISO(form.date))) e.date = 'THAT IS NOT A VALID DATE';
    else if (isBefore(parseISO(form.date), startOfToday())) e.date = 'DATE MUST BE TODAY OR LATER';
    if (!form.time)          e.time  = 'PLEASE SELECT A TIME SLOT';
    if (!form.guests || form.guests < 1 || form.guests > 20) e.guests = '1–20 GUESTS REQUIRED';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('reservations').insert({
        user_id: user?.id ?? null,
        name:   form.name.trim(),
        email:  form.email.trim(),
        phone:  form.phone.trim(),
        date:   form.date,
        time:   form.time,
        guests: form.guests,
        notes:  form.notes?.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      setSubmitted({ ...form });
    } catch (err: any) {
      Alert.alert('RESERVATION FAILED', err.message ?? 'Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  }

  function handleNewReservation() {
    setSubmitted(null);
    setForm({
      ...INITIAL_FORM,
      name:  profile?.full_name || user?.email?.split('@')[0] || '',
      email: user?.email        || '',
      phone: profile?.phone     || '',
    });
    setErrors({});
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    const displayDate = isValid(parseISO(submitted.date))
      ? format(parseISO(submitted.date), 'EEEE, MMMM d, yyyy').toUpperCase()
      : submitted.date;

    return (
      <View style={styles.container}>
        <ScreenHeader title="RESERVATIONS" onMenuPress={() => setDrawerOpen(true)} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>RESERVATION REQUESTED</Text>
            <Text style={styles.successSub}>WE'LL CONFIRM BY EMAIL WITHIN 2 HOURS.</Text>
          </View>

          <View style={styles.bookingCard}>
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>DATE</Text>
              <Text style={styles.bookingValue}>{displayDate}</Text>
            </View>
            <View style={styles.bookingDivider} />
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>TIME</Text>
              <Text style={styles.bookingValue}>{submitted.time}</Text>
            </View>
            <View style={styles.bookingDivider} />
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>GUESTS</Text>
              <Text style={styles.bookingValue}>{submitted.guests} {submitted.guests === 1 ? 'GUEST' : 'GUESTS'}</Text>
            </View>
            <View style={styles.bookingDivider} />
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>STATUS</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>PENDING</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>BACK TO HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={handleNewReservation} activeOpacity={0.8}>
            <Text style={styles.btnOutlineText}>MAKE ANOTHER RESERVATION</Text>
          </TouchableOpacity>
        </ScrollView>
        <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScreenHeader title="RESERVATIONS" onMenuPress={() => setDrawerOpen(true)} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date card */}
          <SectionCard label="SELECT DATE" error={errors.date}>
            <TextInput
              style={[styles.input, errors.date && styles.inputError]}
              value={form.date}
              onChangeText={(v) => setField('date', v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.white}
            />
          </SectionCard>

          {/* Time card */}
          <SectionCard label="SELECT TIME" error={errors.time}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll}>
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
                      <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </SectionCard>

          {/* Guests card */}
          <SectionCard label="NUMBER OF GUESTS" error={errors.guests}>
            <View style={styles.guestCounter}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setField('guests', Math.max(1, form.guests - 1))}
                activeOpacity={0.7}
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.guestCount}>{form.guests}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setField('guests', Math.min(10, form.guests + 1))}
                activeOpacity={0.7}
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push('/contact')} activeOpacity={0.7}>
              <Text style={styles.largePartyText}>
                PARTY OF 10+? CONTACT US DIRECTLY →
              </Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Contact details card */}
          <SectionCard label="YOUR DETAILS">
            <PillInput
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              placeholder="FULL NAME"
              autoComplete="name"
              error={errors.name}
            />
            <PillInput
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              placeholder="EMAIL ADDRESS"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <PillInput
              value={form.phone}
              onChangeText={(v) => setField('phone', v)}
              placeholder="PHONE NUMBER"
              keyboardType="phone-pad"
              error={errors.phone}
            />
          </SectionCard>

          {/* Special requests card */}
          <SectionCard label="SPECIAL REQUESTS (OPTIONAL)">
            <TextInput
              style={styles.textarea}
              value={form.notes ?? ''}
              onChangeText={(v) => setField('notes', v)}
              placeholder="ALLERGIES · CELEBRATIONS · SEATING PREFERENCES"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              selectionColor={Colors.white}
            />
          </SectionCard>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>
              {loading ? 'REQUESTING...' : 'CONFIRM RESERVATION'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            RESERVATIONS ARE SUBJECT TO AVAILABILITY. WE'LL CONFIRM BY EMAIL WITHIN 2 HOURS.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function SectionCard({
  label, children, error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {error && <Text style={styles.sectionError}>{error}</Text>}
      {children}
    </View>
  );
}

function PillInput({
  value, onChangeText, placeholder, keyboardType, autoCapitalize, autoComplete, error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
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
        autoComplete={autoComplete}
        selectionColor={Colors.white}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxxl,
  },

  // Section cards
  sectionCard: {
    borderWidth: 2,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  sectionLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionError: {
    fontSize: 9,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.tight,
  },

  // Pill inputs
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
  inputError: { borderColor: Colors.error },
  fieldError: {
    fontSize: 9,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.tight,
    marginTop: 4,
    marginLeft: Layout.spacing.lg,
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
    minHeight: 100,
  },

  // Time slots
  slotsScroll: { marginHorizontal: -4 },
  slots: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingVertical: 4 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  slotActive: { backgroundColor: Colors.white, borderColor: Colors.white },
  slotText: { fontSize: Layout.fontSize.xs, color: Colors.textSecondary, fontWeight: '500', letterSpacing: 0.5 },
  slotTextActive: { color: Colors.background, fontWeight: '700' },

  // Guest counter
  guestCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.xl,
    paddingVertical: 8,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.borderCardStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 26,
    fontWeight: '300',
  },
  guestCount: {
    fontSize: Layout.fontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: '300',
    minWidth: 40,
    textAlign: 'center',
  },
  largePartyText: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    textAlign: 'center',
    marginTop: 4,
  },

  // Buttons
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
  btnDisabled: { opacity: 0.6 },
  note: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 14,
  },

  // Success
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
  bookingCard: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    overflow: 'hidden',
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 14,
  },
  bookingLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },
  bookingValue: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.tight,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  bookingDivider: { height: 1, backgroundColor: Colors.borderCard },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.warning },
  statusText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.warning,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
});
