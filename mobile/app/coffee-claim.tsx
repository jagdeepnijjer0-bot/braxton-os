import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { format, addMonths, startOfMonth } from 'date-fns';

// Produces a short staff-readable reference from a UUID: "A3F7C2"
function claimRef(id: string): string {
  return id.replace(/-/g, '').slice(0, 6).toUpperCase();
}

export default function CoffeeClaimScreen() {
  const { user, profile, isAuthenticated } = useAuth();
  const {
    isPremium,
    hasClaimedThisMonth,
    coffeeClaim,
    claimCoffee,
    loading,
    refreshing,
    error,
    refresh,
  } = useMembership(user?.id);

  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const currentMonth   = format(new Date(), 'MMMM yyyy');
  const nextClaimDate  = format(startOfMonth(addMonths(new Date(), 1)), 'MMMM d, yyyy');

  // ── Gates ──────────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <GateScreen
          icon="🔒"
          title="Sign In Required"
          sub="Please sign in to claim your free monthly coffee."
          primaryLabel="Sign In"
          onPrimary={() => router.push('/(auth)/login')}
          onBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <GateScreen
          icon="⚠️"
          title="Couldn't Load"
          sub={error}
          primaryLabel="Try Again"
          onPrimary={refresh}
          onBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <GateScreen
          icon="♛"
          title="Premium Members Only"
          sub="Upgrade to Braxton Premium to get one complimentary coffee every month."
          primaryLabel="Upgrade to Premium"
          onPrimary={() => router.replace('/membership')}
          secondaryLabel="Maybe Later"
          onSecondary={() => router.back()}
          onBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  // ── Claim action ───────────────────────────────────────────────────────────

  async function handleClaim() {
    setClaiming(true);
    try {
      await claimCoffee();
      setJustClaimed(true);
    } catch (err: any) {
      Alert.alert('Claim Failed', err.message ?? 'Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  // ── Claimed state (just now OR already this month) ────────────────────────

  if (justClaimed || hasClaimedThisMonth) {
    const claimedAtRaw = coffeeClaim?.claimed_at;
    const claimedAtFull = claimedAtRaw
      ? format(new Date(claimedAtRaw), "MMMM d, yyyy 'at' h:mm a")
      : currentMonth;
    const claimedAtShort = claimedAtRaw
      ? format(new Date(claimedAtRaw), 'MMM d, h:mm a')
      : currentMonth;
    const memberName = profile?.full_name || user?.email?.split('@')[0] || 'Member';
    const ref = coffeeClaim?.id ? claimRef(coffeeClaim.id) : '——';

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.gold} />
          }
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Hero */}
          <LinearGradient colors={['#1A1200', '#0F0A00', '#0A0A0A']} style={styles.hero}>
            <Text style={styles.heroEmoji}>☕</Text>
            <Text style={styles.heroTagline}>
              {justClaimed ? 'ENJOY YOUR COFFEE' : 'ALREADY CLAIMED'}
            </Text>
            <Text style={styles.heroTitle}>
              {justClaimed ? 'Coffee Claimed!' : 'Voucher Active'}
            </Text>
            <Text style={styles.heroSub}>
              {justClaimed
                ? 'Show this screen to any member of staff.'
                : `You claimed your coffee on ${claimedAtShort}.`}
            </Text>
          </LinearGradient>

          {/* Voucher */}
          <View style={styles.voucher}>
            <LinearGradient
              colors={['rgba(201,168,76,0.12)', 'rgba(201,168,76,0.04)']}
              style={styles.voucherGradient}
            >
              {/* Header */}
              <View style={styles.voucherHeader}>
                <Text style={styles.voucherBrand}>BRAXTON</Text>
                <Badge label="Premium" variant="gold" />
              </View>

              {/* Title */}
              <View style={styles.voucherTitleRow}>
                <Text style={styles.voucherTitle}>Complimentary Coffee</Text>
                <View style={styles.claimedStamp}>
                  <Text style={styles.claimedStampText}>✓ CLAIMED</Text>
                </View>
              </View>

              <Text style={styles.voucherDesc}>
                Any hot or iced coffee from our menu — on the house.
              </Text>

              <View style={styles.voucherDivider} />

              {/* Details */}
              <VoucherRow label="Valid for"   value={currentMonth} />
              <VoucherRow label="Member"      value={memberName} />
              <VoucherRow label="Claimed"     value={claimedAtFull} />

              <View style={styles.voucherDivider} />

              {/* Staff verification block */}
              <View style={styles.verifyBlock}>
                <Text style={styles.verifyHeading}>STAFF VERIFICATION</Text>
                <Text style={styles.verifyCode}>{ref}</Text>
                <Text style={styles.verifyNote}>
                  Claim ref · verified against Braxton member records
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Next claim */}
          <View style={styles.nextClaimCard}>
            <Text style={styles.nextClaimIcon}>🗓️</Text>
            <View style={styles.nextClaimBody}>
              <Text style={styles.nextClaimLabel}>Next free coffee</Text>
              <Text style={styles.nextClaimDate}>{nextClaimDate}</Text>
            </View>
          </View>

          <Button
            title="Back to Account"
            onPress={() => router.back()}
            variant="outline"
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Available to claim ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.gold} />
        }
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8 }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <LinearGradient colors={['#1A1200', '#0F0A00', '#0A0A0A']} style={styles.hero}>
          <Text style={styles.heroEmoji}>☕</Text>
          <Text style={styles.heroTagline}>PREMIUM BENEFIT</Text>
          <Text style={styles.heroTitle}>Your Free Coffee</Text>
          <Text style={styles.heroSub}>
            One complimentary coffee every month — any drink, on the house.
          </Text>
        </LinearGradient>

        {/* Voucher preview */}
        <View style={styles.voucher}>
          <View style={styles.voucherPreview}>
            <View style={styles.voucherHeader}>
              <Text style={styles.voucherBrand}>BRAXTON</Text>
              <Badge label="Premium" variant="gold" />
            </View>
            <Text style={styles.voucherTitle}>Complimentary Coffee</Text>
            <Text style={styles.voucherDesc}>
              Any hot or iced coffee from our menu — on the house.
            </Text>
            <View style={styles.voucherDivider} />
            <VoucherRow label="Valid for" value={currentMonth} />
            <VoucherRow
              label="Member"
              value={profile?.full_name || user?.email?.split('@')[0] || 'Premium Member'}
            />
            <View style={styles.voucherDivider} />
            <View style={styles.unclaimedStampRow}>
              <View style={styles.unclaimedStamp}>
                <Text style={styles.unclaimedStampText}>NOT YET CLAIMED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rules */}
        <View style={styles.ruleCard}>
          <RuleRow icon="☑" text="One claim per month — resets on the 1st" />
          <RuleRow icon="☑" text="Any coffee from the menu" />
          <RuleRow icon="☑" text="Show this screen to a staff member" />
          <RuleRow icon="☑" text="In-venue only" />
        </View>

        <Button
          title="Claim My Free Coffee"
          onPress={handleClaim}
          loading={claiming}
          fullWidth
          size="lg"
        />

        <Text style={styles.expiryNote}>
          Unclaimed coffees do not roll over — claim yours before {nextClaimDate}.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GateScreen({
  icon, title, sub, primaryLabel, onPrimary, secondaryLabel, onSecondary, onBack,
}: {
  icon: string;
  title: string;
  sub: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.gate}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8 }}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.gateBody}>
        <Text style={styles.gateIcon}>{icon}</Text>
        <Text style={styles.gateTitle}>{title}</Text>
        <Text style={styles.gateSub}>{sub}</Text>
        <Button title={primaryLabel} onPress={onPrimary} fullWidth size="lg" />
        {secondaryLabel && onSecondary && (
          <Button title={secondaryLabel} onPress={onSecondary} variant="ghost" fullWidth />
        )}
      </View>
    </View>
  );
}

function VoucherRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.voucherRow}>
      <Text style={styles.voucherRowLabel}>{label}</Text>
      <Text style={styles.voucherRowValue}>{value}</Text>
    </View>
  );
}

function RuleRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleIcon}>{icon}</Text>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxxl,
    flexGrow: 1,
  },

  backBtn: { alignSelf: 'flex-start' },
  backText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },

  // Gate screens
  gate: { flex: 1, padding: Layout.spacing.lg },
  gateBody: {
    flex: 1,
    justifyContent: 'center',
    gap: Layout.spacing.md,
    paddingTop: Layout.spacing.xl,
  },
  gateIcon:  { fontSize: 52, textAlign: 'center' },
  gateTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  gateSub:   { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  // Hero
  hero: {
    borderRadius: Layout.borderRadius.xl,
    paddingVertical: Layout.spacing.xxl,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  heroEmoji:   { fontSize: 56 },
  heroTagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 3, fontWeight: '700' },
  heroTitle:   { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  heroSub:     { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Voucher shell
  voucher: {
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    overflow: 'hidden',
  },

  // Claimed voucher — gold gradient fill
  voucherGradient: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },

  // Unclaimed voucher — plain surface
  voucherPreview: {
    backgroundColor: Colors.surface,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },

  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherBrand: {
    fontSize: Layout.fontSize.base,
    color: Colors.gold,
    fontWeight: '800',
    letterSpacing: 3,
  },

  voucherTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  voucherTitle: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  voucherDesc: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  voucherDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },

  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  voucherRowLabel: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  voucherRowValue: { fontSize: Layout.fontSize.sm, color: Colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' },

  // Stamps
  claimedStamp: {
    backgroundColor: 'rgba(76,175,132,0.12)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  claimedStampText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.success,
    fontWeight: '700',
    letterSpacing: 1,
  },
  unclaimedStampRow: { alignItems: 'center', paddingTop: 4 },
  unclaimedStamp: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderStyle: 'dashed',
  },
  unclaimedStampText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // Staff verification
  verifyBlock: {
    alignItems: 'center',
    gap: 4,
    paddingTop: Layout.spacing.xs,
  },
  verifyHeading: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
  },
  verifyCode: {
    fontSize: 36,
    color: Colors.gold,
    fontWeight: '800',
    letterSpacing: 8,
  },
  verifyNote: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Next claim card
  nextClaimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
  },
  nextClaimIcon:  { fontSize: 24 },
  nextClaimBody:  { flex: 1, gap: 2 },
  nextClaimLabel: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextClaimDate:  { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '700' },

  // Rules card
  ruleCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  ruleRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Layout.spacing.sm },
  ruleIcon: { fontSize: Layout.fontSize.sm, color: Colors.success, width: 18 },
  ruleText: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, flex: 1, lineHeight: 20 },

  expiryNote: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
