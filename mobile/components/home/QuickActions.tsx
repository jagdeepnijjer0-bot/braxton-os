import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface QuickAction {
  icon: string;
  label: string;
  onPress: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.action}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{action.icon}</Text>
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  label: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
