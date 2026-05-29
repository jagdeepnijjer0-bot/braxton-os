import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { RestaurantMembership } from '@/lib/types';
import { format } from 'date-fns';

interface MembershipCardProps {
  membership: RestaurantMembership | null;
  memberName: string;
}

export function MembershipCard({ membership, memberName }: MembershipCardProps) {
  const isPremium = membership?.status === 'active';

  return (
    <LinearGradient
      colors={isPremium ? ['#2A1F08', '#1A1200', '#0A0A0A'] : ['#1E1E1E', '#141414', '#0A0A0A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.cardLabel}>BRAXTON</Text>
          <Text style={styles.planLabel}>{isPremium ? 'PREMIUM MEMBER' : 'STANDARD'}</Text>
        </View>
        <Text style={styles.crown}>{isPremium ? '♛' : '☆'}</Text>
      </View>

      <View style={styles.decorLine} />

      <Text style={styles.memberName}>{memberName || 'Guest'}</Text>

      {isPremium && membership?.current_period_end && (
        <Text style={styles.expiry}>
          Valid until {format(new Date(membership.current_period_end), 'MMM yyyy')}
        </Text>
      )}

      {!isPremium && (
        <Text style={styles.upgradeHint}>Upgrade for exclusive benefits</Text>
      )}

      <View style={styles.perks}>
        {isPremium ? (
          <>
            <PerkPill label="☕ Free Coffee Monthly" active />
            <PerkPill label="🥂 Priority Reservations" active />
            <PerkPill label="✦ Exclusive Events" active />
          </>
        ) : (
          <>
            <PerkPill label="☕ Free Coffee" active={false} />
            <PerkPill label="🥂 Priority Booking" active={false} />
          </>
        )}
      </View>
    </LinearGradient>
  );
}

function PerkPill({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.perk, active && styles.perkActive]}>
      <Text style={[styles.perkText, active && styles.perkTextActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    gap: Layout.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: Layout.fontSize.lg,
    color: Colors.gold,
    fontWeight: '800',
    letterSpacing: 3,
  },
  planLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginTop: 2,
  },
  crown: { fontSize: 28 },
  decorLine: {
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.2)',
    marginVertical: Layout.spacing.xs,
  },
  memberName: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expiry: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
  },
  upgradeHint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.gold,
    fontStyle: 'italic',
  },
  perks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  perk: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  perkActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.25)',
  },
  perkText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  perkTextActive: { color: Colors.goldLight },
});
