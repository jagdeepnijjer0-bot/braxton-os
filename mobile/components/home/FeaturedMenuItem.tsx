import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { MenuItem } from '@/lib/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.56;

interface FeaturedMenuItemProps {
  item: MenuItem;
  onPress?: () => void;
}

export function FeaturedMenuItemCard({ item, onPress }: FeaturedMenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.image_url ?? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.info}>
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>£{item.price.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 0.7,
  },
  info: {
    padding: Layout.spacing.md,
    gap: 4,
  },
  category: {
    fontSize: Layout.fontSize.xs,
    color: Colors.gold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  name: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
  priceRow: { marginTop: 4 },
  price: {
    fontSize: Layout.fontSize.lg,
    color: Colors.gold,
    fontWeight: '700',
  },
});
