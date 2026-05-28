import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

// Poll for Stripe webhook to update DB — webhook fires async after checkout
const MAX_POLLS    = 15;   // 15 × 2 s = 30 s maximum wait
const POLL_INTERVAL_MS = 2000;

const PERKS = [
  '☕  Monthly free coffee',
  '📅  Priority reservations',
  '🥂  Welcome drink on every visit',
  '✦   Exclusive member events',
];

export default function SubscriptionSuccessScreen() {
  const { user } = useAuth();
  const { isPremium, refetch } = useMembership(user?.id);

  const [confirmed, setConfirmed]   = useState(false);
  const [timedOut, setTimedOut]     = useState(false);
  const pollCountRef                = useRef(0);

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
  }, [isPremium]);

  // ── Timed out (webhook very delayed) ──────────────────────────────────────
  if (timedOut && !confirmed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.icon}>⏳</Text>
          <Text style={styles.title}>Almost there…</Text>
          <Text style={styles.body}>
            Your payment was received but it's taking a moment to activate. Pull to refresh on the Account screen in a few seconds.
          </Text>
          <Button
            title="Go to Account"
            onPress={() => router.replace('/(tabs)/account')}
            fullWidth
            size="lg"
            style={{ marginTop: Layout.spacing.lg }}
          />
          <Button
            title="View Subscription"
            onPress={() => router.replace('/manage-subscription')}
            variant="outline"
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Waiting for webhook ────────────────────────────────────────────────────
  if (!confirmed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.waitingTitle}>Activating your membership…</Text>
          <Text style={styles.waitingBody}>This only takes a few seconds.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#1A1200', '#0A0A0A']} style={styles.gradient}>
      <SafeAreaView style={styles.gradientSafe}>
        <View style={styles.successContainer}>
          <Text style={styles.crown}>♛</Text>
          <Text style={styles.tagline}>BRAXTON PREMIUM</Text>
          <Text style={styles.successTitle}>Welcome to Premium!</Text>
          <Text style={styles.successBody}>
            Your membership is now active. Enjoy your exclusive benefits.
          </Text>

          <View style={styles.perksList}>
            {PERKS.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>

          <Button
            title="Explore Your Benefits"
            onPress={() => router.replace('/(tabs)/account')}
            fullWidth
            size="lg"
            style={{ marginTop: Layout.spacing.lg }}
          />
          <Button
            title="Claim Your Free Coffee"
            onPress={() => router.replace('/coffee-claim')}
            variant="outline"
            fullWidth
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  container: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
    backgroundColor: Colors.background,
  },

  // Waiting states
  waitingTitle: { fontSize: Layout.fontSize.lg, color: Colors.textPrimary, fontWeight: '700', textAlign: 'center', marginTop: Layout.spacing.md },
  waitingBody:  { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  // Timeout state
  icon:  { fontSize: 52, textAlign: 'center' },
  title: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  body:  { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  // Success state
  gradient:     { flex: 1 },
  gradientSafe: { flex: 1 },
  successContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  crown:        { fontSize: 52, textAlign: 'center' },
  tagline:      { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 3, fontWeight: '700', textAlign: 'center' },
  successTitle: { fontSize: Layout.fontSize.xxxl, color: Colors.white, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  successBody:  { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  perksList: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    overflow: 'hidden',
    marginTop: Layout.spacing.sm,
  },
  perkRow: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  perkText: { fontSize: Layout.fontSize.sm, color: Colors.textPrimary },
});
