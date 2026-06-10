import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { useGallery } from '@/hooks/useGallery';

const { width } = require('react-native').Dimensions.get('window');
const ITEM_SIZE = (width - Layout.spacing.lg * 2 - Layout.spacing.sm * 2) / 3;

export default function GalleryScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { images, loading, refreshing, error, refresh, refetch } = useGallery();

  return (
    <View style={styles.container}>
      <ScreenHeader title="GALLERY" onMenuPress={() => setDrawerOpen(true)} />

      {loading ? (
        <GallerySkeleton />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>FAILED TO LOAD GALLERY</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      ) : images.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.white} />
          }
        >
          <Text style={styles.emptyText}>NO PHOTOS YET</Text>
          <Text style={styles.emptySub}>PULL DOWN TO REFRESH</Text>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.white} />
          }
        >
          <GalleryGrid images={images} />
        </ScrollView>
      )}

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function GallerySkeleton() {
  const pulse = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.2, duration: 800, useNativeDriver: true }),
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
    paddingTop: Layout.spacing.md,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingBottom: Layout.spacing.xxl,
    paddingTop: Layout.spacing.md,
  },
  emptyScroll: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.wider,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  retryText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
  },
  emptyText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  emptySub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wide,
  },
});
