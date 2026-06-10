import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

// Poll for Stripe webhook to update DB — webhook fires async after checkout
const MAX_POLLS        = 15;   // 15 × 2 s = 30 s maximum wait
const POLL_INTERVAL_MS = 2000;

const PERKS = [
  'MONTHLY FREE COFFEE',
  'PRIORITY RESERVATIONS',
  'WELCOME DRINK ON EVERY VISIT',
  'EXCLUSIVE MEMBER EVENTS',
];

export default function SubscriptionSuccessScreen() {
  const { user } = useAuth();
  const { isPremium, refetch } = useMembership(user?.id);
  const insets = useSafeAreaInsets();

  const [confirmed, setConfirmed] = useState(false);
  const [timedOut,  setTimedOut]  = useState(false);
  const pollCountRef              = useRef(0);

  useEffect(() => {
    if (isPremium) {
      setConfirmed(true);
      return;
    }

    // Webhook hasn't fired yet — poll until DB reflects premium status
    const tick = () => {
      if (pollCountRef.current >= MAX_POLLS) {
        setTimedOut(true);
        return;
      }
      pollCountRef.current += 1;
      refetch();
    };

    const timer = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPremium, refetch]);

  // ── Timed out (webhook very delayed) ──────────────────────────────────────
  if (timedOut && !confirmed) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.centeredContainer}>
          <Text style={styles.stateIcon}>⏳</Text>
          <Text style={styles.stateTitle}>ALMOST THERE…</Text>
          <Text style={styles.stateBody}>
            YOUR PAYMENT WAS RECEIVED BUT IT'S TAKING A MOMENT TO ACTIVATE. CHECK THE ACCOUNT
            SCREEN IN A FEW SECONDS.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: Layout.spacing.lg }]}
            onPress={() => router.replace('/account')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>GO TO ACCOUNT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.replace('/manage-subscription')}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineBtnText}>VIEW SUBSCRIPTION</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Waiting for webhook ────────────────────────────────────────────────────
  if (!confirmed) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
          <Text style={styles.waitingTitle}>ACTIVATING YOUR MEMBERSHIP…</Text>
          <Text style={styles.waitingBody}>THIS ONLY TAKES A FEW SECONDS.</Text>
        </View>
      </View>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.successContainer}>
        <Text style={styles.crown}>♛</Text>
        <Text style={styles.tagline}>CAFE LOCCO PREMIUM</Text>
        <Text style={styles.successTitle}>WELCOME TO PREMIUM</Text>
        <Text style={styles.successBody}>
          YOUR MEMBERSHIP IS NOW ACTIVE. ENJOY YOUR EXCLUSIVE BENEFITS.
        </Text>

        <View style={styles.perksList}>
          {PERKS.map((perk, index) => (
            <View
              key={perk}
              style={[
                styles.perkRow,
                index === PERKS.length - 1 && styles.perkRowLast,
              ]}
            >
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { marginTop: Layout.spacing.lg }]}
          onPress={() => router.replace('/my-membership')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>VIEW MY MEMBERSHIP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.replace('/coffee-claim')}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>CLAIM FREE COFFEE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  centeredContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },

  // Waiting state
  waitingTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
    marginTop: Layout.spacing.md,
  },
  waitingBody: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Timeout state
  stateIcon: { fontSize: 52, textAlign: 'center' },
  stateTitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },
  stateBody: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Success state
  successContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  crown: {
    fontSize: 72,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  tagline: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: Layout.fontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },
  successBody: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: Layout.letterSpacing.wider,
  },

  perksList: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    overflow: 'hidden',
    marginTop: Layout.spacing.sm,
  },
  perkRow: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCard,
  },
  perkRowLast: {
    borderBottomWidth: 0,
  },
  perkText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Shared buttons
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.background,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },
  outlineBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderCardStrong,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: Colors.textPrimary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },
});
