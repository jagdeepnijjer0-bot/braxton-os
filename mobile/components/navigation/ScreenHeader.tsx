import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface ScreenHeaderProps {
  title: string;
  onMenuPress: () => void;
  showBack?: boolean;
}

export function ScreenHeader({ title, onMenuPress, showBack = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => (showBack ? router.back() : router.replace('/'))}
          activeOpacity={0.7}
        >
          {showBack ? (
            <Text style={styles.iconText}>‹</Text>
          ) : (
            <Text style={styles.iconText}>⌂</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
          <View style={styles.hamburger}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={[styles.hamburgerLine, styles.hamburgerLineShort]} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.border} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: 4,
  },
  iconText: {
    color: Colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
  },
  title: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
  hamburger: {
    gap: 4,
    alignItems: 'flex-end',
  },
  hamburgerLine: {
    height: 1.5,
    width: 18,
    backgroundColor: Colors.textPrimary,
    borderRadius: 1,
  },
  hamburgerLineShort: {
    width: 12,
  },
  border: {
    height: 1,
    backgroundColor: Colors.borderCard,
  },
});
