import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MembershipCard } from '@/components/membership/MembershipCard';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { RestaurantMembership } from '@/lib/types';

type BadgeVariant = 'gold' | 'success' | 'error' | 'warning' | 'neutral';

const MEMBERSHIP_BADGE: Record<RestaurantMembership['status'], { variant: BadgeVariant; label: string }> = {
  active:    { variant: 'gold',    label: 'Premium' },
  past_due:  { variant: 'warning', label: 'Payment Due' },
  cancelled: { variant: 'error',   label: 'Cancelled' },
  inactive:  { variant: 'neutral', label: 'Standard' },
};

export default function AccountScreen() {
  const { user, profile, signOut, isAuthenticated, loading, error, refreshProfile } = useAuth();
  const { membership, isPremium, refreshing: membershipRefreshing, refresh: refreshMembership } = useMembership(user?.id);

  // ── Loading gate — prevents flash of unauthenticated screen ──────────────
  if (loading) return <LoadingSpinner fullScreen />;

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LinearGradient colors={['#0A0A0A', '#0A0A0A']} style={styles.notAuthContainer}>
          <Text style={styles.braxtonLogo}>♛</Text>
          <Text style={styles.braxtonTagline}>BRAXTON</Text>
          <Text style={styles.notAuthTitle}>Your Account</Text>
          <Text style={styles.notAuthSub}>
            Sign in to view your profile, membership, reservations, and exclusive member benefits.
          </Text>
          <View style={styles.notAuthActions}>
            <Button title="Sign In"       onPress={() => router.push('/(auth)/login')}  fullWidth size="lg" />
            <Button title="Create Account" onPress={() => router.push('/(auth)/signup')} variant="outline" fullWidth size="lg" />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ── Error (profile failed to load) ────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Couldn't Load Profile</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <Button title="Try Again" onPress={refreshProfile} fullWidth />
          <Button title="Sign Out"  onPress={() => signOut().catch(() => {})} variant="ghost" fullWidth textStyle={{ color: Colors.error }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Sign-out handler ───────────────────────────────────────────────────────
  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () =>
          signOut().catch((err) =>
            Alert.alert('Sign Out Failed', err?.message ?? 'Please try again.')
          ),
      },
    ]);
  }

  function handleRefresh() {
    refreshProfile();
    refreshMembership();
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member';
  const initial     = displayName.charAt(0).toUpperCase();
  const statusInfo  = membership ? MEMBERSHIP_BADGE[membership.status] : null;

  // ── Main authenticated screen ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={membershipRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
          />
        }
      >
        {/* ── Profile header ── */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, isPremium && styles.avatarPremium]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {statusInfo && (
              <Badge
                label={statusInfo.label}
                variant={statusInfo.variant}
                style={styles.statusBadge}
              />
            )}
          </View>
        </View>

        {/* ── Membership card ── */}
        <MembershipCard membership={membership} memberName={displayName} />

        {/* ── Upgrade CTA (non-premium only) ── */}
        {!isPremium && (
          <Button
            title="✦  Upgrade to Premium"
            onPress={() => router.push('/membership')}
            fullWidth
            size="lg"
          />
        )}

        {/* ── Premium actions ── */}
        {isPremium && (
          <Card padded={false}>
            <MenuRow
              icon="☕"
              label="Claim Free Coffee"
              onPress={() => router.push('/coffee-claim')}
              badge="Monthly"
            />
          </Card>
        )}

        {/* ── Membership section ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>MEMBERSHIP</Text>
        </View>
        <Card padded={false}>
          <MenuRow
            icon="♛"
            label="My Membership"
            sub={isPremium ? 'View your premium benefits' : 'Discover what Premium includes'}
            onPress={() => router.push('/membership')}
          />
          <Divider />
          <MenuRow
            icon="💳"
            label="Manage Subscription"
            sub="Billing, invoices, cancel anytime"
            onPress={() => router.push('/manage-subscription')}
          />
        </Card>

        {/* ── Account section ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>ACCOUNT</Text>
        </View>
        <Card padded={false}>
          <MenuRow icon="📅" label="Make a Reservation" onPress={() => router.push('/reservations')} />
          <Divider />
          <MenuRow icon="💬" label="Contact Us"         onPress={() => router.push('/contact')} />
          <Divider />
          <MenuRow icon="📖" label="Our Story"          onPress={() => router.push('/about')} />
        </Card>

        {/* ── Sign out ── */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
          fullWidth
          textStyle={{ color: Colors.error }}
        />

        <Text style={styles.version}>Braxton · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MenuRow({
  icon, label, sub, onPress, badge,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
      </View>
      {badge
        ? <Badge label={badge} variant="gold" style={styles.menuBadge} />
        : <Text style={styles.menuChevron}>›</Text>
      }
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.tabBarHeight + Layout.spacing.xl,
  },

  // Unauthenticated
  notAuthContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  braxtonLogo:    { fontSize: 40, color: Colors.gold, textAlign: 'center' },
  braxtonTagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 3, fontWeight: '700', textAlign: 'center' },
  notAuthTitle:   { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center', marginTop: Layout.spacing.sm },
  notAuthSub:     { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: Layout.spacing.sm },
  notAuthActions: { width: '100%', gap: Layout.spacing.sm, marginTop: Layout.spacing.md },

  // Error
  errorContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  errorIcon:  { fontSize: 40, textAlign: 'center' },
  errorTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  errorSub:   { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Profile header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPremium: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderColor: Colors.gold,
  },
  avatarText:   { fontSize: Layout.fontSize.xxl, color: Colors.gold, fontWeight: '800' },
  profileInfo:  { flex: 1, gap: 3 },
  profileName:  { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  profileEmail: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  statusBadge:  { alignSelf: 'flex-start', marginTop: 2 },

  // Section labels
  sectionLabel: { marginTop: Layout.spacing.xs },
  sectionLabelText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  menuIcon:     { fontSize: 18, width: 24, textAlign: 'center' },
  menuContent:  { flex: 1, gap: 2 },
  menuLabel:    { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '500' },
  menuSub:      { fontSize: Layout.fontSize.xs, color: Colors.textMuted },
  menuBadge:    { marginLeft: 'auto' },
  menuChevron:  { fontSize: 20, color: Colors.textMuted },
  divider:      { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: Layout.spacing.md },

  version: {
    textAlign: 'center',
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Layout.spacing.xs,
  },
});
