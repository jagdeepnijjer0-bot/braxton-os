import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

export default function SubscriptionCancelScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.container}>
        <Text style={styles.icon}>✕</Text>
        <Text style={styles.title}>CHECKOUT CANCELLED</Text>
        <Text style={styles.body}>NO CHARGE WAS MADE.</Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { marginTop: Layout.spacing.lg }]}
          onPress={() => router.replace('/membership')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>VIEW MEMBERSHIP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  icon: {
    fontSize: 52,
    color: Colors.error,
    textAlign: 'center',
    fontWeight: '300',
  },
  title: {
    fontSize: Layout.fontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },
  body: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },

  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.background,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },
  outlineBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderCardStrong,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: Colors.textPrimary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },
});
