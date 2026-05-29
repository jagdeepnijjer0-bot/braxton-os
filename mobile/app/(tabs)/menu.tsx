import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { MenuCategoryTabs } from '@/components/menu/MenuCategoryTab';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMenu } from '@/hooks/useMenu';

export default function MenuScreen() {
  const { filtered, categories, activeCategory, setActiveCategory, loading, error, refetch } = useMenu();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.tagline}>BRAXTON</Text>
        <Text style={styles.title}>Our Menu</Text>
      </View>

      <MenuCategoryTabs
        categories={categories}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load menu</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>No items in this category</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MenuItemCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.sm,
    gap: 2,
  },
  tagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 2, fontWeight: '600' },
  title: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },
  list: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.tabBarHeight + Layout.spacing.xl,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Layout.spacing.sm },
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
  emptyText: { fontSize: Layout.fontSize.base, color: Colors.textSecondary },
});
