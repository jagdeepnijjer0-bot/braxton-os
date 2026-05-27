import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { MenuItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface MenuItemCardProps {
  item: MenuItem;
  onPress?: () => void;
}

export function MenuItemCard({ item, onPress }: MenuItemCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.image_url ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300' }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.is_featured && <Badge label="Chef's Pick" variant="gold" />}
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.sm,
  },
  image: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.md,
    gap: 4,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  description: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  price: {
    fontSize: Layout.fontSize.lg,
    color: Colors.gold,
    fontWeight: '700',
    marginTop: 4,
  },
});
