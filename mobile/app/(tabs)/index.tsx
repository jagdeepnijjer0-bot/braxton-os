import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedMenuItemCard } from '@/components/home/FeaturedMenuItem';
import { QuickActions } from '@/components/home/QuickActions';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMenu } from '@/hooks/useMenu';

const OPENING_HOURS = [
  { day: 'Mon – Thu', hours: '12pm – 10pm' },
  { day: 'Fri – Sat', hours: '12pm – 11pm' },
  { day: 'Sunday', hours: '11am – 9pm' },
];

const QUICK_ACTIONS = (nav: typeof router) => [
  { icon: '📅', label: 'Reserve', onPress: () => nav.push('/reservations') },
  { icon: '📖', label: 'Menu', onPress: () => nav.push('/(tabs)/menu') },
  { icon: '📸', label: 'Gallery', onPress: () => nav.push('/(tabs)/gallery') },
  { icon: '💬', label: 'Contact', onPress: () => nav.push('/contact') },
];

export default function HomeScreen() {
  const { featured, loading } = useMenu();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <HeroSection
          onReserve={() => router.push('/reservations')}
          onMenu={() => router.push('/(tabs)/menu')}
        />

        <View style={styles.content}>
          <QuickActions actions={QUICK_ACTIONS(router)} />

          {loading ? (
            <LoadingSpinner />
          ) : featured.length > 0 ? (
            <View>
              <SectionHeader
                subtitle="This Week"
                title="Chef's Picks"
                actionLabel="See All"
                onAction={() => router.push('/(tabs)/menu')}
              />
              <FlatList
                data={featured}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: Layout.spacing.sm }} />}
                renderItem={({ item }) => <FeaturedMenuItemCard item={item} />}
                contentContainerStyle={styles.featuredList}
              />
            </View>
          ) : null}

          <View style={styles.story}>
            <SectionHeader subtitle="Our Story" title="A Legacy of Taste" centered />
            <Text style={styles.storyText}>
              Since 2010, Braxton has been crafting unforgettable dining experiences.
              Our chefs blend classical French technique with local seasonal ingredients
              to create dishes that celebrate the art of fine dining.
            </Text>
            <View style={styles.statsRow}>
              <Stat value="14+" label="Years" />
              <View style={styles.statDivider} />
              <Stat value="3" label="Awards" />
              <View style={styles.statDivider} />
              <Stat value="48" label="Seats" />
            </View>
          </View>

          <View style={styles.hoursCard}>
            <SectionHeader subtitle="We're Open" title="Opening Hours" />
            {OPENING_HOURS.map((h) => (
              <View key={h.day} style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{h.day}</Text>
                <Text style={styles.hoursTime}>{h.hours}</Text>
              </View>
            ))}
            <View style={styles.addressRow}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.addressText}>
                24 Mayfair Lane, London W1J 7BX
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Layout.tabBarHeight + Layout.spacing.xl },
  content: { padding: Layout.spacing.lg, gap: Layout.spacing.xl },
  featuredList: { paddingBottom: Layout.spacing.xs },
  story: { alignItems: 'center', gap: Layout.spacing.md },
  storyText: {
    fontSize: Layout.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Layout.fontSize.xxl, color: Colors.gold, fontWeight: '800' },
  statLabel: { fontSize: Layout.fontSize.xs, color: Colors.textSecondary, letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  hoursCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  hoursDay: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  hoursTime: { fontSize: Layout.fontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  addressRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.xs,
    alignItems: 'flex-start',
  },
  addressIcon: { fontSize: 14 },
  addressText: { flex: 1, fontSize: Layout.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
