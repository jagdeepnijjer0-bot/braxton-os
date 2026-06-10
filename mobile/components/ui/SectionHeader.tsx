import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  centered?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  centered = false,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, centered && styles.centered]}>
      <View style={styles.titleRow}>
        <View style={[styles.titleGroup, centered && styles.centeredGroup]}>
          {subtitle && <Text style={[styles.subtitle, centered && styles.centeredText]}>{subtitle}</Text>}
          <Text style={[styles.title, centered && styles.centeredText]}>{title}</Text>
        </View>
        {actionLabel && onAction && (
          <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.action}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Layout.spacing.lg },
  centered: { alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  titleGroup: { gap: 4 },
  centeredGroup: { alignItems: 'center' },
  subtitle: {
    fontSize: Layout.fontSize.xs,
    color: Colors.gold,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  centeredText: { textAlign: 'center' },
  title: {
    fontSize: Layout.fontSize.xxl,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  action: {
    fontSize: Layout.fontSize.sm,
    color: Colors.gold,
    fontWeight: '500',
  },
});
