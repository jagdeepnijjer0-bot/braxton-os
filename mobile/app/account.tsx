import React, { useState } from 'react';
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
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

export default function AccountScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, profile, signOut, isAuthenticated, loading, error, refreshProfile } = useAuth();
  const {
    membership,
    isPremium,
    refreshing: membershipRefreshing,
    refresh: refreshMembership,
  } = useMembership(user?.id);

  if (loading) return <LoadingSpinner fullScreen />;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="MY ACCOUNT" onMenuPress={() => setDrawerOpen(true)} />
        <View style={styles.unauthContainer}>
          <Text style={styles.unauthTitle}>MY ACCOUNT</Text>
          <Text style={styles.unauthSub}>
            SIGN IN TO VIEW YOUR PROFILE, MEMBERSHIP, AND RESERVATIONS.
          </Text>
          <View style={styles.unauthActions}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>SIGN IN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.8}
            >
              <Text style={styles.btnOutlineText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>
        </View>
        <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    );
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut().catch(() => {}),
      },
    ]);
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <ScreenHeader title="MY ACCOUNT" onMenuPress={() => setDrawerOpen(true)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={membershipRefreshing}
            onRefresh={() => { refreshProfile(); refreshMembership(); }}
            tintColor={Colors.white}
          />
        }
      >
        {/* Profile header */}
        <View style={styles.profileRow}>
          <View style={[styles.avatar, isPremium && styles.avatarPremium]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName.toUpperCase()}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {isPremium && <Text style={styles.premiumBadge}>PREMIUM MEMBER</Text>}
          </View>
        </View>

        {/* Membership card */}
        <View style={styles.card}>
          <AccountRow
            label="MY MEMBERSHIP"
            sub={isPremium ? 'VIEW PREMIUM BENEFITS' : 'DISCOVER WHAT PREMIUM INCLUDES'}
            onPress={() => router.push(isPremium ? '/my-membership' : '/membership')}
          />
          <View style={styles.cardDivider} />
          <AccountRow
            label="MANAGE SUBSCRIPTION"
            sub="BILLING · INVOICES · CANCEL"
            onPress={() => router.push('/manage-subscription')}
          />
          {isPremium && (
            <>
              <View style={styles.cardDivider} />
              <AccountRow
                label="CLAIM FREE COFFEE"
                sub="MONTHLY BENEFIT"
                onPress={() => router.push('/coffee-claim')}
              />
            </>
          )}
        </View>

        {/* Account section */}
        <View style={styles.card}>
          <AccountRow label="EDIT PROFILE"       onPress={() => router.push('/edit-profile')} />
          <View style={styles.cardDivider} />
          <AccountRow label="MY RESERVATIONS"    onPress={() => router.push('/my-reservations')} />
          <View style={styles.cardDivider} />
          <AccountRow label="MAKE A RESERVATION" onPress={() => router.push('/reservations')} />
          <View style={styles.cardDivider} />
          <AccountRow label="CONTACT US"         onPress={() => router.push('/contact')} />
          <View style={styles.cardDivider} />
          <AccountRow label="OUR STORY"          onPress={() => router.push('/about')} />
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function AccountRow({
  label,
  sub,
  onPress,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxxl,
  },

  // Unauthenticated
  unauthContainer: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  unauthTitle: {
    fontSize: Layout.fontSize.xxl,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
    textAlign: 'center',
  },
  unauthSub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 18,
    paddingHorizontal: Layout.spacing.sm,
  },
  unauthActions: {
    width: '100%',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
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
    width: '100%',
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

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPremium: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: Colors.gold,
  },
  avatarText: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wide,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
  },
  premiumBadge: {
    fontSize: 9,
    color: Colors.gold,
    letterSpacing: Layout.letterSpacing.wider,
    marginTop: 2,
  },

  // Cards
  card: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderCard,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Layout.spacing.lg,
  },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: Colors.textMuted,
    marginLeft: 8,
  },

  // Sign out
  signOutBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: Layout.spacing.lg,
  },
  signOutText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
});
