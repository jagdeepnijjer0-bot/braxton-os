import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { MenuCategory } from '@/lib/types';

interface MenuCategoryTabsProps {
  categories: MenuCategory[];
  active: MenuCategory;
  onSelect: (cat: MenuCategory) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all:       'All',
  breakfast: 'Breakfast',
  classics:  'Classics',
  drinks:    'Drinks',
  desserts:  'Desserts',
};

export function MenuCategoryTabs({ categories, active, onSelect }: MenuCategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            style={[styles.tab, isActive && styles.activeTab]}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {CATEGORY_LABELS[cat] ?? cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeLabel: {
    color: Colors.background,
    fontWeight: '700',
  },
});
