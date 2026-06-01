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

const RESTAURANT_ADDRESS = process.env.EXPO_PUBLIC_RESTAURANT_ADDRESS ?? '';

const OPENING_HOURS = [
  { day: 'Monday',    hours: '9am – 8pm' },
  { day: 'Tuesday',   hours: '9am – 8pm' },
  { day: 'Wednesday', hours: '9am – 8pm' },
  { day: 'Thursday',  hours: '9am – 8pm' },
  { day: 'Friday',    hours: '9am – 8pm' },
  { day: 'Saturday',  hours: '9am – 8pm' },
  { day: 'Sunday',    hours: '9am – 8pm' },
];

const QUICK_ACTIONS = (nav: typeof router) => [
  { icon: '📅', label: 'Reserve', onPress: () => nav.push('/reservations') },
  { icon: '📖', label: 'Menu',    onPress: () => nav.push('/(tabs)/menu') },
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

          <View style={styles.hoursCard}>
            <SectionHeader subtitle="We're Open" title="Opening Hours" />
            {OPENING_HOURS.map((h) => (
              <View key={h.day} style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{h.day}</Text>
                <Text style={styles.hoursTime}>{h.hours}</Text>
              </View>
            ))}
            {RESTAURANT_ADDRESS ? (
              <View style={styles.addressRow}>
                <Text style={styles.addressIcon}>📍</Text>
                <Text style={styles.addressText}>{RESTAURANT_ADDRESS}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { paddingBottom: Layout.tabBarHeight + Layout.spacing.xl },
  content:      { padding: Layout.spacing.lg, gap: Layout.spacing.xl },
  featuredList: { paddingBottom: Layout.spacing.xs },

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
  hoursDay:  { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
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
