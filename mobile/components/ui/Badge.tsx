import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

type BadgeVariant = 'gold' | 'success' | 'error' | 'warning' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gold: { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)' },
  success: { backgroundColor: 'rgba(76,175,132,0.15)' },
  error: { backgroundColor: 'rgba(224,85,85,0.15)' },
  warning: { backgroundColor: 'rgba(224,160,85,0.15)' },
  neutral: { backgroundColor: Colors.surfaceElevated },
  text_gold: { color: Colors.gold },
  text_success: { color: Colors.success },
  text_error: { color: Colors.error },
  text_warning: { color: Colors.warning },
  text_neutral: { color: Colors.textSecondary },
});
