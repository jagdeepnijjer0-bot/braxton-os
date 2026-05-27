import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
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
import { format } from 'date-fns';

export default function CoffeeClaimScreen() {
  const { user, isAuthenticated } = useAuth();
  const { membership, isPremium, hasClaimedThisMonth, coffeeClaim, claimCoffee, loading } = useMembership(user?.id);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.centeredTitle}>Sign In Required</Text>
          <Text style={styles.centeredSub}>Please sign in to claim your free coffee.</Text>
          <Button title="Sign In" onPress={() => router.push('/(auth)/login')} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.lockIcon}>♛</Text>
          <Text style={styles.centeredTitle}>Premium Members Only</Text>
          <Text style={styles.centeredSub}>
            Upgrade to Braxton Premium to claim your free coffee every month.
          </Text>
          <Button title="Upgrade to Premium" onPress={() => router.replace('/membership')} fullWidth />
          <Button title="Maybe Later" onPress={() => router.back()} variant="ghost" fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  async function handleClaim() {
    setClaiming(true);
    try {
      await claimCoffee();
      setClaimed(true);
    } catch (err: any) {
      Alert.alert('Claim Failed', err.message ?? 'Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  const currentMonth = format(new Date(), 'MMMM yyyy');

  if (claimed || hasClaimedThisMonth) {
    const claimedAt = coffeeClaim?.claimed_at
      ? format(new Date(coffeeClaim.claimed_at), 'MMMM d, yyyy')
      : currentMonth;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtnTop}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <LinearGradient colors={['#1A1200', '#0A0A0A']} style={styles.successGradient}>
            <Text style={styles.coffeeEmoji}>☕</Text>
            <Text style={styles.successTitle}>Coffee Claimed!</Text>
            <Text style={styles.successSub}>
              {claimed ? 'Enjoy your complimentary coffee.' : `Already claimed on ${claimedAt}.`}
            </Text>
          </LinearGradient>

          <View style={styles.voucher}>
            <View style={styles.voucherHeader}>
              <Text style={styles.voucherBrand}>BRAXTON</Text>
              <Badge label="Premium" variant="gold" />
            </View>
            <View style={styles.voucherDivider} />
            <Text style={styles.voucherTitle}>Complimentary Coffee</Text>
            <Text style={styles.voucherDesc}>
              Present this screen to a member of staff to claim your coffee.
            </Text>
            <View style={styles.voucherFooter}>
              <Text style={styles.voucherMonth}>Valid for {currentMonth}</Text>
              <View style={styles.voucherStamp}>
                <Text style={styles.voucherStampText}>✓ CLAIMED</Text>
              </View>
            </View>
          </View>

          <Text style={styles.nextClaim}>
            Your next free coffee will be available on 1st of next month.
          </Text>

          <Button title="Back to Account" onPress={() => router.back()} variant="outline" fullWidth />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtnTop}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <LinearGradient colors={['#1A1200', '#0A0A0A']} style={styles.heroGradient}>
          <Text style={styles.coffeeEmoji}>☕</Text>
          <Text style={styles.heroTagline}>PREMIUM BENEFIT</Text>
          <Text style={styles.heroTitle}>Your Free Coffee</Text>
          <Text style={styles.heroSub}>
            As a Premium Member, you get one complimentary coffee per month.
          </Text>
        </LinearGradient>

        <View style={styles.voucherPreview}>
          <View style={styles.voucherHeader}>
            <Text style={styles.voucherBrand}>BRAXTON</Text>
            <Badge label="Premium" variant="gold" />
          </View>
          <View style={styles.voucherDivider} />
          <Text style={styles.voucherTitle}>Complimentary Coffee</Text>
          <Text style={styles.voucherDesc}>
            Any hot or iced coffee from our menu — on the house.
          </Text>
          <Text style={styles.voucherMonth}>Valid for {currentMonth}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoItem}>☑ One claim per month</Text>
          <Text style={styles.infoItem}>☑ Any coffee from the menu</Text>
          <Text style={styles.infoItem}>☑ Show screen to staff</Text>
          <Text style={styles.infoItem}>☑ Available in-venue only</Text>
        </View>

        <Button
          title="Claim My Free Coffee"
          onPress={handleClaim}
          loading={claiming}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.spacing.lg, gap: Layout.spacing.lg, paddingBottom: Layout.spacing.xxxl, flexGrow: 1 },
  centered: { flex: 1, padding: Layout.spacing.xl, justifyContent: 'center', gap: Layout.spacing.md },
  closeBtn: { alignSelf: 'flex-start', marginBottom: Layout.spacing.lg },
  closeBtnTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  closeText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  lockIcon: { fontSize: 48, textAlign: 'center' },
  centeredTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  centeredSub: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  heroGradient: {
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  successGradient: {
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  coffeeEmoji: { fontSize: 56, textAlign: 'center' },
  heroTagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 2, fontWeight: '700' },
  heroTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  heroSub: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successTitle: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  successSub: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  voucher: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  voucherPreview: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  voucherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voucherBrand: { fontSize: Layout.fontSize.base, color: Colors.gold, fontWeight: '800', letterSpacing: 2 },
  voucherDivider: { height: 1, backgroundColor: Colors.border },
  voucherTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  voucherDesc: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  voucherMonth: { fontSize: Layout.fontSize.xs, color: Colors.textMuted },
  voucherFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Layout.spacing.xs },
  voucherStamp: {
    backgroundColor: 'rgba(76,175,132,0.1)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  voucherStampText: { fontSize: Layout.fontSize.xs, color: Colors.success, fontWeight: '700', letterSpacing: 1 },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  infoItem: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  nextClaim: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, textAlign: 'center' },
});
