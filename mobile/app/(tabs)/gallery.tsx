import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { useGallery } from '@/hooks/useGallery';

const { width } = require('react-native').Dimensions.get('window');
const ITEM_SIZE = (width - Layout.spacing.lg * 2 - Layout.spacing.sm * 2) / 3;

export default function GalleryScreen() {
  const { images, loading, refreshing, error, refresh, refetch } = useGallery();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.tagline}>BRAXTON</Text>
        <Text style={styles.title}>Gallery</Text>
        <Text style={styles.subtitle}>A glimpse into our world</Text>
      </View>

      {loading ? (
        <GallerySkeleton />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Failed to load gallery</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : images.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.gold}
            />
          }
        >
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySub}>Pull down to refresh</Text>
        </ScrollView>
      ) : (
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
          <GalleryGrid images={images} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
function GallerySkeleton() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.75,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={skelStyles.grid}>
      {Array.from({ length: 9 }).map((_, i) => (
        <Animated.View key={i} style={[skelStyles.item, { opacity: pulse }]} />
      ))}
    </View>
  );
}

const skelStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.md,
    gap: 2,
  },
  tagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 2, fontWeight: '600' },
  title: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
  scroll: {
    paddingBottom: Layout.tabBarHeight + Layout.spacing.xl,
    paddingTop: Layout.spacing.sm,
  },
  emptyScroll: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Layout.spacing.sm },
  errorIcon: { fontSize: 36 },
  errorText: { fontSize: Layout.fontSize.base, color: Colors.error, fontWeight: '600' },
  errorSub: { fontSize: Layout.fontSize.sm, color: Colors.textMuted },
  retryBtn: {
    marginTop: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  retryText: { fontSize: Layout.fontSize.sm, color: Colors.gold, fontWeight: '600' },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, fontWeight: '600' },
  emptySub: { fontSize: Layout.fontSize.sm, color: Colors.textMuted },
});
