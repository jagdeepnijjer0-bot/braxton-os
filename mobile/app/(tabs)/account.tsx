import React from 'react';
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
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MembershipCard } from '@/components/membership/MembershipCard';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

interface MenuRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
}

function MenuRow({ icon, label, onPress, badge }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge && <Badge label={badge} variant="gold" style={{ marginLeft: 'auto', marginRight: Layout.spacing.sm }} />}
      {!badge && <Text style={styles.menuChevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const { membership, isPremium } = useMembership(user?.id);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.notAuthContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.notAuthTitle}>Sign in to your account</Text>
          <Text style={styles.notAuthSubtitle}>
            Access your reservations, membership, and exclusive benefits.
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            size="lg"
          />
          <Button
            title="Create Account"
            onPress={() => router.push('/(auth)/signup')}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Member';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {isPremium && <Badge label="Premium Member" variant="gold" />}
          </View>
        </View>

        <MembershipCard membership={membership} memberName={displayName} />

        {!isPremium && (
          <Button
            title="✦  Upgrade to Premium"
            onPress={() => router.push('/membership')}
            fullWidth
            size="lg"
            style={styles.upgradeBtn}
          />
        )}

        <Card padded={false}>
          <MenuRow icon="☕" label="Claim Free Coffee" onPress={() => router.push('/coffee-claim')} badge={isPremium ? 'Monthly' : undefined} />
          <View style={styles.divider} />
          <MenuRow icon="📅" label="Make a Reservation" onPress={() => router.push('/reservations')} />
          <View style={styles.divider} />
          <MenuRow icon="💳" label="Manage Subscription" onPress={() => router.push('/manage-subscription')} />
          <View style={styles.divider} />
          <MenuRow icon="📖" label="Our Story" onPress={() => router.push('/about')} />
          <View style={styles.divider} />
          <MenuRow icon="💬" label="Contact Us" onPress={() => router.push('/contact')} />
        </Card>

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
          fullWidth
          style={{ marginTop: Layout.spacing.sm }}
          textStyle={{ color: Colors.error }}
        />

        <Text style={styles.version}>Braxton v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.tabBarHeight + Layout.spacing.xl,
  },
  notAuthContainer: {
    flex: 1,
    padding: Layout.spacing.lg,
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  lockIcon: { fontSize: 48, textAlign: 'center' },
  notAuthTitle: {
    fontSize: Layout.fontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  notAuthSubtitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Layout.fontSize.xxl, color: Colors.background, fontWeight: '800' },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  userEmail: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  upgradeBtn: { backgroundColor: Colors.gold },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  menuIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '500' },
  menuChevron: { fontSize: 20, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: Layout.spacing.md },
  version: { textAlign: 'center', fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: Layout.spacing.sm },
});
