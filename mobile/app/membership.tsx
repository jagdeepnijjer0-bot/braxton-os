import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { createCheckoutSession } from '@/lib/stripe';

const PLAN_PRICE = process.env.EXPO_PUBLIC_MEMBERSHIP_PRICE_DISPLAY ?? '£24.00 / month';
const PRICE_ID   = process.env.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID  ?? '';

const PERKS = [
  { icon: '☕', title: 'Monthly Free Coffee',    desc: 'One complimentary coffee every month' },
  { icon: '📅', title: 'Priority Reservations',  desc: 'Skip the queue — reserve up to 60 days ahead' },
  { icon: '🥂', title: 'Welcome Drink',           desc: 'Complimentary aperitif on every visit' },
  { icon: '🎂', title: 'Birthday Surprise',       desc: 'A special gift on your birthday month' },
  { icon: '✦',  title: 'Member Events',           desc: "Exclusive access to chef's table evenings" },
  { icon: '🛍️', title: '10% Off Takeaway',        desc: 'Discount on all takeaway orders' },
];

export default function MembershipScreen() {
  const { user, isAuthenticated } = useAuth();
  const { membership, isPremium, isCancelledPending, loading } = useMembership(user?.id);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (loading) return <LoadingSpinner fullScreen />;

  // ── Already premium and NOT scheduled for cancellation ────────────────────
  if (isPremium && !isCancelledPending) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.alreadyContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.crownIcon}>♛</Text>
          <Text style={styles.alreadyTitle}>You're already Premium!</Text>
          <Text style={styles.alreadyText}>
            Enjoy all your exclusive benefits. Thank you for being a valued member.
          </Text>
          <Button
            title="Manage Subscription"
            onPress={() => router.push('/manage-subscription')}
            fullWidth
            variant="outline"
          />
          <Button title="Close" onPress={() => router.back()} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  async function handleSubscribe() {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (!PRICE_ID) {
      Alert.alert('Configuration Error', 'Subscription is not available right now. Please contact us.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession(PRICE_ID);
      if (!result?.url) throw new Error('No checkout URL returned.');

      // Open Stripe Checkout in the in-app browser.
      // openAuthSessionAsync closes automatically when Stripe redirects to braxton://
      const webResult = await WebBrowser.openAuthSessionAsync(result.url, 'braxton://');

      if (webResult.type === 'success') {
        // Stripe redirected back — subscription is being processed by the webhook
        router.replace('/subscription-success');
      }
      // type === 'cancel' or 'dismiss' means the user closed the browser — stay on this screen
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('already have an active')) {
        Alert.alert('Already Subscribed', msg);
        router.push('/manage-subscription');
      } else {
        Alert.alert('Subscription Error', msg || 'Could not start subscription. Please try again.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ── Subscription page ──────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={['#1A1200', '#0A0A0A']} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.heroContent}>
            <Text style={styles.crownHero}>♛</Text>
            <Text style={styles.heroTagline}>BRAXTON PREMIUM</Text>
            <Text style={styles.heroTitle}>The Finest{'\n'}Dining Experience</Text>
            <Text style={styles.heroSubtitle}>
              Join our exclusive membership and unlock a world of privileges.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Cancellation-pending notice */}
          {isCancelledPending && membership?.cancel_at && (
            <View style={styles.cancelPendingBanner}>
              <Text style={styles.cancelPendingIcon}>ℹ️</Text>
              <Text style={styles.cancelPendingText}>
                Your subscription is scheduled to cancel on{' '}
                {new Date(membership.cancel_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                You can resubscribe below or keep your access from the portal.
              </Text>
            </View>
          )}

          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Text style={styles.planName}>Premium Membership</Text>
              <Text style={styles.price}>{PLAN_PRICE}</Text>
              <Text style={styles.pricingNote}>Cancel anytime — no commitment</Text>
            </View>
          </View>

          <Text style={styles.perksTitle}>What's included</Text>
          <View style={styles.perks}>
            {PERKS.map((perk) => (
              <View key={perk.title} style={styles.perkRow}>
                <View style={styles.perkIcon}>
                  <Text style={styles.perkEmoji}>{perk.icon}</Text>
                </View>
                <View style={styles.perkContent}>
                  <Text style={styles.perkTitle}>{perk.title}</Text>
                  <Text style={styles.perkDesc}>{perk.desc}</Text>
                </View>
                <Text style={styles.perkCheck}>✓</Text>
              </View>
            ))}
          </View>

          <Button
            title={
              isAuthenticated
                ? isCancelledPending
                  ? `Reactivate — ${PLAN_PRICE}`
                  : `Start Premium — ${PLAN_PRICE}`
                : 'Sign In to Subscribe'
            }
            onPress={handleSubscribe}
            loading={checkoutLoading}
            fullWidth
            size="lg"
          />

          <Text style={styles.legal}>
            Billed monthly. Cancel anytime through the app or Stripe Customer Portal.
            By subscribing you agree to our Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safe:      { flex: 1, backgroundColor: Colors.background },
  scroll:    { paddingBottom: Layout.spacing.xxxl },
  hero:      { paddingBottom: Layout.spacing.xxl },

  heroContent: {
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Layout.spacing.md,
  },
  closeText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  crownHero:    { fontSize: 40, textAlign: 'center', marginBottom: Layout.spacing.sm },
  heroTagline:  { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 3, fontWeight: '700', textAlign: 'center' },
  heroTitle:    { fontSize: Layout.fontSize.xxxl, color: Colors.white, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, lineHeight: 42 },
  heroSubtitle: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  content: { padding: Layout.spacing.lg, gap: Layout.spacing.lg },

  cancelPendingBanner: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  cancelPendingIcon: { fontSize: 16 },
  cancelPendingText: { flex: 1, fontSize: Layout.fontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  pricingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    overflow: 'hidden',
  },
  pricingHeader: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  planName:    { fontSize: Layout.fontSize.sm, color: Colors.gold, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  price:       { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800' },
  pricingNote: { fontSize: Layout.fontSize.xs, color: Colors.textMuted },

  perksTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  perks: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    gap: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkEmoji:   { fontSize: 18 },
  perkContent: { flex: 1, gap: 2 },
  perkTitle:   { fontSize: Layout.fontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  perkDesc:    { fontSize: Layout.fontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  perkCheck:   { fontSize: Layout.fontSize.base, color: Colors.success, fontWeight: '700' },
  legal:       { fontSize: Layout.fontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

  alreadyContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  crownIcon:    { fontSize: 56, textAlign: 'center' },
  alreadyTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  alreadyText:  { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
