import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MembershipCard } from '@/components/membership/MembershipCard';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { createPortalSession } from '@/lib/stripe';
import { format } from 'date-fns';

export default function ManageSubscriptionScreen() {
  const { user, profile, isAuthenticated } = useAuth();
  const { membership, isPremium, loading } = useMembership(user?.id);
  const [portalLoading, setPortalLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.centeredTitle}>Sign In Required</Text>
          <Button title="Sign In" onPress={() => router.push('/(auth)/login')} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  async function openCustomerPortal() {
    setPortalLoading(true);
    try {
      const result = await createPortalSession();
      if (result?.url) {
        await Linking.openURL(result.url);
      }
    } catch (err: any) {
      Alert.alert(
        'Unable to Open Portal',
        'Please try again or contact support at hello@braxtonrestaurant.com',
      );
    } finally {
      setPortalLoading(false);
    }
  }

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Member';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Subscription</Text>
        </View>

        <MembershipCard membership={membership} memberName={displayName} />

        {isPremium && membership ? (
          <View style={styles.details}>
            <DetailRow
              label="Status"
              value={membership.status}
              badge={<Badge label={membership.status} variant="success" />}
            />
            <DetailRow label="Plan" value="Braxton Premium" />
            {membership.current_period_start && (
              <DetailRow
                label="Started"
                value={format(new Date(membership.current_period_start), 'MMMM d, yyyy')}
              />
            )}
            {membership.current_period_end && (
              <DetailRow
                label="Renews"
                value={format(new Date(membership.current_period_end), 'MMMM d, yyyy')}
              />
            )}
            <DetailRow label="Price" value="£24.00 / month" />
          </View>
        ) : (
          <View style={styles.noMembership}>
            <Text style={styles.noMembershipText}>
              You don't have an active subscription.
            </Text>
          </View>
        )}

        {isPremium ? (
          <View style={styles.actions}>
            <Button
              title="Manage on Stripe Portal"
              onPress={openCustomerPortal}
              loading={portalLoading}
              fullWidth
              size="lg"
              variant="outline"
            />
            <Text style={styles.portalNote}>
              You'll be taken to the secure Stripe Customer Portal to update your payment method,
              view invoices, or cancel your subscription.
            </Text>
            <Button
              title="☕  Claim Free Coffee"
              onPress={() => router.push('/coffee-claim')}
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button
              title="Upgrade to Premium — £24/mo"
              onPress={() => router.push('/membership')}
              fullWidth
              size="lg"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {badge ?? <Text style={styles.detailValue}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.spacing.lg, gap: Layout.spacing.md, paddingBottom: Layout.spacing.xxxl },
  centered: { flex: 1, padding: Layout.spacing.xl, justifyContent: 'center', gap: Layout.spacing.md },
  closeBtn: { alignSelf: 'flex-start', marginBottom: Layout.spacing.sm },
  closeText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },
  lockIcon: { fontSize: 48, textAlign: 'center' },
  centeredTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  pageHeader: { gap: Layout.spacing.sm },
  title: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  details: {
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
  detailLabel: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  detailValue: { fontSize: Layout.fontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  noMembership: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.lg,
  },
  noMembershipText: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  actions: { gap: Layout.spacing.sm },
  portalNote: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
