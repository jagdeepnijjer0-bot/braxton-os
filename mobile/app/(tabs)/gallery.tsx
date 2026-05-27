import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useGallery } from '@/hooks/useGallery';

export default function GalleryScreen() {
  const { images, loading, error } = useGallery();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.tagline}>BRAXTON</Text>
        <Text style={styles.title}>Gallery</Text>
        <Text style={styles.subtitle}>A glimpse into our world</Text>
      </View>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load gallery</Text>
        </View>
      ) : images.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyText}>No photos yet</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <GalleryGrid images={images} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

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
  scroll: { paddingBottom: Layout.tabBarHeight + Layout.spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Layout.spacing.sm },
  errorText: { fontSize: Layout.fontSize.base, color: Colors.error },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: Layout.fontSize.base, color: Colors.textSecondary },
});
