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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { createCheckoutSession } from '@/lib/stripe';

const PRICE_DISPLAY = process.env.EXPO_PUBLIC_MEMBERSHIP_PRICE_DISPLAY ?? '£19.99 / month';
const PRICE_ID      = process.env.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID  ?? '';

const BENEFITS = [
  { icon: '☕', label: 'FREE MONTHLY COFFEE', desc: 'ONE COMPLIMENTARY COFFEE EVERY MONTH' },
  { icon: '📅', label: 'PRIORITY RESERVATIONS', desc: 'RESERVE UP TO 60 DAYS IN ADVANCE' },
  { icon: '♛', label: 'EXCLUSIVE MEMBER PERKS', desc: 'VIP ACCESS · EVENTS · BIRTHDAY SURPRISE' },
];

export default function MembershipScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { membership, isPremium, isCancelledPending, loading } = useMembership(user?.id);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (loading) return <LoadingSpinner fullScreen />;

  // Already premium (not cancelling)
  if (isPremium && !isCancelledPending) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.alreadyContainer}>
          <Text style={styles.alreadyTitle}>YOU'RE ALREADY A MEMBER</Text>
          <Text style={styles.alreadySub}>
            THANK YOU FOR BEING PART OF CAFÉ LOCCO.
          </Text>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => router.replace('/my-membership')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnOutlineText}>VIEW MY MEMBERSHIP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.btnGhostText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  async function handleSubscribe() {
    if (!isAuthenticated) {
      router.push('/(auth)/signup');
      return;
    }
    if (!PRICE_ID) {
      Alert.alert('Not Available', 'Subscription is not available right now. Please contact us.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession(PRICE_ID);
      if (!result?.url) throw new Error('No checkout URL returned.');

      const webResult = await WebBrowser.openAuthSessionAsync(result.url, 'cafelocco://');
      if (webResult.type === 'success') {
        router.replace('/subscription-success');
      }
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.iconBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MEMBERSHIP</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.headerBorder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.headlineTitle}>PREMIUM{'\n'}SUBSCRIPTION</Text>
          <Text style={styles.headlineSub}>YOUR DAILY COFFEE PERFECTED.</Text>
        </View>

        {/* Price card */}
        <View style={styles.priceCard}>
          <Text style={styles.priceAmount}>£19.99</Text>
          <Text style={styles.pricePeriod}>PER MONTH</Text>
          <Text style={styles.priceNote}>CANCEL ANYTIME · NO COMMITMENT</Text>
        </View>

        {/* Cancellation-pending notice */}
        {isCancelledPending && membership?.cancel_at && (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>
              YOUR SUBSCRIPTION CANCELS ON{' '}
              {new Date(membership.cancel_at)
                .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                .toUpperCase()}
              . RESUBSCRIBE BELOW TO KEEP YOUR BENEFITS.
            </Text>
          </View>
        )}

        {/* Benefits */}
        {BENEFITS.map((b) => (
          <View key={b.label} style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>{b.icon}</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>{b.label}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.btnPrimary, checkoutLoading && styles.btnDisabled]}
          onPress={handleSubscribe}
          disabled={checkoutLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>
            {checkoutLoading
              ? 'LOADING...'
              : isAuthenticated
              ? isCancelledPending
                ? 'REACTIVATE MEMBERSHIP'
                : 'SIGN UP & SUBSCRIBE'
              : 'SIGN UP & SUBSCRIBE'}
          </Text>
        </TouchableOpacity>

        {/* Secondary CTA */}
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnOutlineText}>ALREADY A MEMBER? LOG IN</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          BILLED MONTHLY. CANCEL ANYTIME THROUGH THE APP OR STRIPE PORTAL.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
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
  iconBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
  },

  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxxl,
  },

  // Headline
  headline: {
    gap: 8,
    paddingVertical: Layout.spacing.lg,
  },
  headlineTitle: {
    fontSize: Layout.fontSize.xxxl,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.tight,
    fontWeight: '600',
    lineHeight: 40,
  },
  headlineSub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Price card
  priceCard: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: 6,
  },
  priceAmount: {
    fontSize: 48,
    color: Colors.textPrimary,
    letterSpacing: -1,
    fontWeight: '300',
  },
  pricePeriod: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },
  priceNote: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    marginTop: 4,
  },

  // Notice banner
  noticeBanner: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
  },
  noticeText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Benefit cards
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.lg,
  },
  benefitIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  benefitContent: { flex: 1, gap: 4 },
  benefitLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  benefitDesc: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
  },

  // Buttons
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
  btnOutline: {
    paddingVertical: 18,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCardStrong,
    alignItems: 'center',
  },
  btnOutlineText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  btnGhost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },
  btnDisabled: { opacity: 0.6 },

  legal: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 14,
  },

  // Already premium
  alreadyContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: 4,
    margin: Layout.spacing.lg,
    marginBottom: 0,
  },
  closeBtnText: { color: Colors.textPrimary, fontSize: 16 },
  alreadyTitle: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
    textAlign: 'center',
  },
  alreadySub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
