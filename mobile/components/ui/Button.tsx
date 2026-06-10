import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.gold : Colors.background}
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.borderRadius.md,
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  primary: { backgroundColor: Colors.gold },
  secondary: { backgroundColor: Colors.surfaceElevated },
  outline: { borderWidth: 1, borderColor: Colors.gold, backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.error },

  size_sm: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
  size_md: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 50 },
  size_lg: { paddingVertical: 18, paddingHorizontal: 32, minHeight: 58 },

  text: { fontWeight: '600', letterSpacing: 0.5 },
  text_primary: { color: Colors.background },
  text_secondary: { color: Colors.textPrimary },
  text_outline: { color: Colors.gold },
  text_ghost: { color: Colors.gold },
  text_danger: { color: Colors.white },

  textSize_sm: { fontSize: Layout.fontSize.sm },
  textSize_md: { fontSize: Layout.fontSize.base },
  textSize_lg: { fontSize: Layout.fontSize.lg },
});
