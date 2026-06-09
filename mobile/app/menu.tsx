import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMenu } from '@/hooks/useMenu';
import { MenuItem } from '@/lib/types';

export default function MenuScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { filtered, categories, activeCategory, setActiveCategory, loading, error, refetch } =
    useMenu();

  return (
    <View style={styles.container}>
      <ScreenHeader title="MENU" onMenuPress={() => setDrawerOpen(true)} />

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabs}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, activeCategory === cat && styles.tabActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
              {cat.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>FAILED TO LOAD MENU</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>NO ITEMS IN THIS CATEGORY</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MenuItemRow item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function MenuItemRow({ item }: { item: MenuItem }) {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemTop}>
        <Text style={styles.menuItemName}>{item.name.toUpperCase()}</Text>
        <Text style={styles.menuItemPrice}>£{item.price.toFixed(2)}</Text>
      </View>
      {item.description ? (
        <Text style={styles.menuItemDesc} numberOfLines={2}>
          {item.description.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  tabs: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCard,
  },
  tabsContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 14,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  tabText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.wide,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.background,
  },

  list: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderCard,
    marginVertical: 16,
  },

  menuItem: {
    gap: 6,
  },
  menuItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  menuItemName: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.normal,
    fontWeight: '600',
    paddingRight: 12,
  },
  menuItemPrice: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.tight,
    fontWeight: '600',
  },
  menuItemDesc: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 16,
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
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },
});
