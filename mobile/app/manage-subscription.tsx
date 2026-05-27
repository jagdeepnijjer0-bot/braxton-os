import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
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
import { MembershipCard } from '@/components/membership/MembershipCard';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { createPortalSession } from '@/lib/stripe';
import { format, isPast, parseISO } from 'date-fns';
import { useState } from 'react';
import { RestaurantMembership } from '@/lib/types';

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_RESTAURANT_EMAIL ?? 'hello@braxtonrestaurant.com';
const PLAN_PRICE    = process.env.EXPO_PUBLIC_MEMBERSHIP_PRICE_DISPLAY ?? '£24.00 / month';

type BadgeVariant = 'gold' | 'success' | 'error' | 'warning' | 'neutral';

const STATUS_BADGE: Record<RestaurantMembership['status'], { variant: BadgeVariant; label: string }> = {
  active:    { variant: 'success', label: 'Active'        },
  past_due:  { variant: 'warning', label: 'Payment Due'   },
  cancelled: { variant: 'error',   label: 'Cancelled'     },
  inactive:  { variant: 'neutral', label: 'No Plan'       },
};

export default function ManageSubscriptionScreen() {
  const { user, profile, isAuthenticated } = useAuth();
  const {
    membership,
    isPremium,
    isPastDue,
    isCancelledWithAccess,
    hasAccess,
    loading,
    refreshing,
    error,
    refresh,
    refetch,
  } = useMembership(user?.id);

  const [portalLoading, setPortalLoading] = useState(false);

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.gate}>
          <TouchableOpacity onPress={() => router.back()} style={styles.gateBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.gateIcon}>🔒</Text>
          <Text style={styles.gateTitle}>Sign In Required</Text>
          <Text style={styles.gateSub}>Please sign in to manage your subscription.</Text>
          <Button title="Sign In" onPress={() => router.push('/(auth)/login')} fullWidth size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.gate}>
          <TouchableOpacity onPress={() => router.back()} style={styles.gateBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.gateIcon}>⚠️</Text>
          <Text style={styles.gateTitle}>Couldn't Load Membership</Text>
          <Text style={styles.gateSub}>{error}</Text>
          <Button title="Try Again" onPress={refetch} fullWidth />
          <Button title="Back" onPress={() => router.back()} variant="outline" fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  // ── Stripe Customer Portal ─────────────────────────────────────────────────
  async function openCustomerPortal() {
    setPortalLoading(true);
    try {
      const result = await createPortalSession();
      if (result?.url) {
        const supported = await Linking.canOpenURL(result.url);
        if (supported) {
          await Linking.openURL(result.url);
        } else {
          Alert.alert('Cannot open link', 'Please try opening the portal from a browser.');
        }
      }
    } catch {
      Alert.alert(
        'Unable to Open Portal',
        `Please try again or contact us at ${SUPPORT_EMAIL}`,
      );
    } finally {
      setPortalLoading(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Member';
  const statusInfo   = STATUS_BADGE[membership?.status ?? 'inactive'];

  function formatPeriodDate(isoDate: string | null): string {
    if (!isoDate) return '—';
    try { return format(parseISO(isoDate), 'MMMM d, yyyy'); }
    catch { return isoDate; }
  }

  // Renewal vs cancellation label
  function periodLabel(): string {
    if (!membership?.current_period_end) return '—';
    if (membership.status === 'cancelled') {
      return isPast(parseISO(membership.current_period_end))
        ? 'Access expired'
        : `Access until ${formatPeriodDate(membership.current_period_end)}`;
    }
    return formatPeriodDate(membership.current_period_end);
  }

  const renewsLabel   = membership?.status === 'cancelled' ? 'Access ends' : 'Renews';

  // ── Main screen ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.gold}
          />
        }
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.tagline}>BRAXTON</Text>
          <Text style={styles.title}>My Subscription</Text>
        </View>

        {/* Membership card */}
        <MembershipCard membership={membership} memberName={displayName} />

        {/* Past-due warning banner */}
        {isPastDue && (
          <LinearGradient
            colors={['rgba(224,160,85,0.15)', 'rgba(224,160,85,0.05)']}
            style={styles.warningBanner}
          >
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningBody}>
              <Text style={styles.warningTitle}>Payment Required</Text>
              <Text style={styles.warningSub}>
                Your last payment failed. Update your payment method to keep your benefits.
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Cancelled-with-access info banner */}
        {isCancelledWithAccess && (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledIcon}>ℹ️</Text>
            <Text style={styles.cancelledText}>
              Your subscription is cancelled but your benefits remain active until{' '}
              {formatPeriodDate(membership!.current_period_end)}.
            </Text>
          </View>
        )}

        {/* Subscription detail rows */}
        {membership ? (
          <View style={styles.detailCard}>
            <DetailRow
              label="Status"
              right={<Badge label={statusInfo.label} variant={statusInfo.variant} />}
            />
            <DetailRow label="Plan" value="Braxton Premium" />
            {membership.current_period_start && (
              <DetailRow
                label="Started"
                value={formatPeriodDate(membership.current_period_start)}
              />
            )}
            {membership.current_period_end && (
              <DetailRow
                label={renewsLabel}
                value={periodLabel()}
                highlight={membership.status === 'cancelled'}
              />
            )}
            <DetailRow label="Price" value={PLAN_PRICE} isLast />
          </View>
        ) : (
          <View style={styles.noMembershipCard}>
            <Text style={styles.noMembershipIcon}>✦</Text>
            <Text style={styles.noMembershipTitle}>No Active Plan</Text>
            <Text style={styles.noMembershipSub}>
              Upgrade to Premium to unlock exclusive member benefits.
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {hasAccess ? (
            <>
              <Button
                title="Manage on Stripe Portal"
                onPress={openCustomerPortal}
                loading={portalLoading}
                fullWidth
                size="lg"
                variant="outline"
              />
              <Text style={styles.portalNote}>
                Update your payment method, download invoices, or cancel — all through
                the secure Stripe Customer Portal.
              </Text>
              {isPremium && (
                <Button
                  title="☕  Claim Free Coffee"
                  onPress={() => router.push('/coffee-claim')}
                  fullWidth
                />
              )}
            </>
          ) : (
            <Button
              title={`Upgrade to Premium — ${PLAN_PRICE}`}
              onPress={() => router.push('/membership')}
              fullWidth
              size="lg"
            />
          )}
        </View>

        {/* Stripe badge */}
        <View style={styles.stripeRow}>
          <Text style={styles.stripeLock}>🔒</Text>
          <Text style={styles.stripeText}>
            Payments secured by Stripe. Braxton never stores your card details.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  right,
  highlight = false,
  isLast = false,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  highlight?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      {right ?? (
        <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
          {value ?? '—'}
        </Text>
      )}
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
  },

  // Gate (not-authed / error)
  gate: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  gateBack: { alignSelf: 'flex-start', marginBottom: Layout.spacing.sm },
  gateIcon:  { fontSize: 48, textAlign: 'center' },
  gateTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  gateSub:   { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Header
  pageHeader: { gap: 4 },
  backText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm, marginBottom: Layout.spacing.sm },
  tagline:  { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 2, fontWeight: '600' },
  title:    { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },

  // Past-due warning
  warningBanner: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(224,160,85,0.3)',
    alignItems: 'flex-start',
  },
  warningIcon:  { fontSize: 20 },
  warningBody:  { flex: 1, gap: 4 },
  warningTitle: { fontSize: Layout.fontSize.sm, color: Colors.warning, fontWeight: '700' },
  warningSub:   { fontSize: Layout.fontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  // Cancelled banner
  cancelledBanner: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  cancelledIcon: { fontSize: 16 },
  cancelledText: { flex: 1, fontSize: Layout.fontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  // Detail card
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel:   { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  detailValue:   { fontSize: Layout.fontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  detailValueHighlight: { color: Colors.error },

  // No membership
  noMembershipCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  noMembershipIcon:  { fontSize: 32, color: Colors.textMuted },
  noMembershipTitle: { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  noMembershipSub:   { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Actions
  actions: { gap: Layout.spacing.sm },
  portalNote: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Stripe trust badge
  stripeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.sm,
  },
  stripeLock: { fontSize: 12 },
  stripeText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    flex: 1,
    lineHeight: 16,
  },
});
