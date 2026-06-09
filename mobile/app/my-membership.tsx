import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { createPortalSession } from '@/lib/stripe';
import { format, parseISO, addMonths, startOfMonth } from 'date-fns';

const PRICE_DISPLAY = process.env.EXPO_PUBLIC_MEMBERSHIP_PRICE_DISPLAY ?? '£19.99 / month';

export default function MyMembershipScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const { user, profile, isAuthenticated } = useAuth();
  const {
    membership,
    isPremium,
    hasClaimedThisMonth,
    coffeeClaim,
    claimCoffee,
    loading,
    refreshing,
    error,
    refresh,
  } = useMembership(user?.id);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="MY MEMBERSHIP" onMenuPress={() => setDrawerOpen(true)} />
        <View style={styles.gate}>
          <Text style={styles.gateTitle}>SIGN IN REQUIRED</Text>
          <Text style={styles.gateSub}>SIGN IN TO ACCESS YOUR MEMBERSHIP.</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.btnPrimaryText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
        <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="MY MEMBERSHIP" onMenuPress={() => setDrawerOpen(true)} />
        <View style={styles.gate}>
          <Text style={styles.gateTitle}>PREMIUM REQUIRED</Text>
          <Text style={styles.gateSub}>UPGRADE TO ACCESS YOUR MEMBERSHIP DASHBOARD.</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/membership')}>
            <Text style={styles.btnPrimaryText}>VIEW MEMBERSHIP</Text>
          </TouchableOpacity>
        </View>
        <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    );
  }

  async function handleClaimCoffee() {
    setClaiming(true);
    try {
      await claimCoffee();
    } catch (err: any) {
      Alert.alert('Claim Failed', err.message ?? 'Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const result = await createPortalSession();
      if (result?.url) {
        const ok = await Linking.canOpenURL(result.url);
        if (ok) await Linking.openURL(result.url);
      }
    } catch {
      Alert.alert('Unable to Open Portal', 'Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member';
  const memberSince = membership?.created_at
    ? format(parseISO(membership.created_at), 'MMMM yyyy')
    : '—';
  const nextBilling = membership?.current_period_end
    ? format(parseISO(membership.current_period_end), 'MMMM d, yyyy')
    : '—';
  const nextClaimDate = format(startOfMonth(addMonths(new Date(), 1)), 'MMMM d, yyyy');
  const today = format(new Date(), 'EEEE');
  const dateStr = format(new Date(), 'MMMM d');

  return (
    <View style={styles.container}>
      <ScreenHeader title="MY MEMBERSHIP" onMenuPress={() => setDrawerOpen(true)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.white} />
        }
      >
        {/* Date + greeting */}
        <View style={styles.dateRow}>
          <Text style={styles.dateDay}>{today.toUpperCase()}</Text>
          <Text style={styles.dateDate}>{dateStr.toUpperCase()}</Text>
        </View>

        {/* Coffee claim card */}
        <View style={styles.coffeeCard}>
          <Image
            source={require('../assets/images/coffee.png')}
            style={styles.coffeeImage}
            resizeMode="cover"
          />
          <View style={styles.coffeeOverlay} />

          {hasClaimedThisMonth ? (
            <View style={styles.coffeeContent}>
              <View style={styles.claimedBadge}>
                <Text style={styles.claimedBadgeText}>✓ CLAIMED</Text>
              </View>
              <Text style={styles.coffeeClaimed}>TODAY'S COFFEE CLAIMED</Text>
              <Text style={styles.coffeeClaimedSub}>SEE YOU TOMORROW</Text>
              <Text style={styles.coffeeNextClaim}>NEXT CLAIM: {nextClaimDate.toUpperCase()}</Text>
            </View>
          ) : (
            <View style={styles.coffeeContent}>
              <Text style={styles.coffeeTitle}>YOUR FREE COFFEE</Text>
              <Text style={styles.coffeeSub}>MONTHLY PREMIUM BENEFIT</Text>
              <TouchableOpacity
                style={[styles.claimBtn, claiming && styles.claimBtnDisabled]}
                onPress={handleClaimCoffee}
                disabled={claiming}
                activeOpacity={0.8}
              >
                <Text style={styles.claimBtnText}>
                  {claiming ? 'CLAIMING...' : 'CLAIM YOUR FREE COFFEE'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* VIP access banner */}
        <View style={styles.vipBanner}>
          <Text style={styles.vipText}>♛  VIP ACCESS GRANTED</Text>
        </View>

        {/* Membership details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>PREMIUM MONTHLY</Text>
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <DetailRow label="NEXT BILL" value={nextBilling} />
          <View style={styles.cardDivider} />
          <DetailRow label="PLAN PRICE" value={PRICE_DISPLAY} />
          <View style={styles.cardDivider} />
          <DetailRow label="MEMBER SINCE" value={memberSince.toUpperCase()} />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={openPortal}
          disabled={portalLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnOutlineText}>
            {portalLoading ? 'OPENING...' : 'MANAGE SUBSCRIPTION'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={openPortal}
          activeOpacity={0.8}
        >
          <Text style={styles.btnOutlineText}>UPDATE PAYMENT METHOD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => {
            Alert.alert(
              'Cancel Membership',
              'You will continue to have access until the end of your billing period. Proceed?',
              [
                { text: 'Keep Membership', style: 'cancel' },
                { text: 'Cancel', style: 'destructive', onPress: openPortal },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.btnGhostText}>CANCEL MEMBERSHIP</Text>
        </TouchableOpacity>

        <Text style={styles.stripeNote}>
          🔒  MANAGED SECURELY BY STRIPE
        </Text>
      </ScrollView>

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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

  // Gate
  gate: {
    flex: 1,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  gateTitle: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
    textAlign: 'center',
  },
  gateSub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  dateDate: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Coffee card
  coffeeCard: {
    borderRadius: Layout.borderRadius.card,
    overflow: 'hidden',
    height: 220,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  coffeeImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coffeeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  coffeeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.lg,
    gap: 8,
  },
  claimedBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  claimedBadgeText: {
    fontSize: 10,
    color: Colors.success,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
  },
  coffeeTitle: {
    fontSize: Layout.fontSize.lg,
    color: Colors.white,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  coffeeSub: {
    fontSize: Layout.fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: Layout.letterSpacing.wide,
  },
  coffeeClaimed: {
    fontSize: Layout.fontSize.base,
    color: Colors.white,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  coffeeClaimedSub: {
    fontSize: Layout.fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: Layout.letterSpacing.wider,
  },
  coffeeNextClaim: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: Layout.letterSpacing.wider,
    marginTop: 4,
  },
  claimBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.white,
    marginTop: 4,
  },
  claimBtnDisabled: { opacity: 0.6 },
  claimBtnText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.background,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
  },

  // VIP banner
  vipBanner: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  vipText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },

  // Details card
  card: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.lg,
  },
  cardTitle: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  activeText: {
    fontSize: 9,
    color: Colors.success,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  cardDivider: { height: 1, backgroundColor: Colors.borderCard },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 14,
  },
  detailLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wide,
  },
  detailValue: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.tight,
    fontWeight: '600',
  },

  // Buttons
  btnPrimary: {
    width: '100%',
    paddingVertical: 16,
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
    paddingVertical: 16,
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
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.wider,
  },

  stripeNote: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wide,
    textAlign: 'center',
    marginTop: Layout.spacing.xs,
  },
});
