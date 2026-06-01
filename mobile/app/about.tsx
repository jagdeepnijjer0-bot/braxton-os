import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

const RESTAURANT_ADDRESS = process.env.EXPO_PUBLIC_RESTAURANT_ADDRESS ?? '';
const RESTAURANT_PHONE   = process.env.EXPO_PUBLIC_RESTAURANT_PHONE   ?? '';
const RESTAURANT_EMAIL   = process.env.EXPO_PUBLIC_RESTAURANT_EMAIL   ?? '';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.tagline}>ABOUT US</Text>
          <Text style={styles.title}>Our Story</Text>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerStar}>✦</Text>
          <View style={styles.dividerLine} />
        </View>

        {(RESTAURANT_ADDRESS || RESTAURANT_PHONE || RESTAURANT_EMAIL) ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Find Us</Text>
            {RESTAURANT_ADDRESS ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText}>{RESTAURANT_ADDRESS}</Text>
              </View>
            ) : null}
            {RESTAURANT_PHONE ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📞</Text>
                <Text style={styles.infoText}>{RESTAURANT_PHONE}</Text>
              </View>
            ) : null}
            {RESTAURANT_EMAIL ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>✉️</Text>
                <Text style={styles.infoText}>{RESTAURANT_EMAIL}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.spacing.lg, gap: Layout.spacing.lg, paddingBottom: Layout.spacing.xxxl },

  backBtn:  { alignSelf: 'flex-start', marginBottom: Layout.spacing.sm },
  backText: { color: Colors.textSecondary, fontSize: Layout.fontSize.sm },

  header:  { gap: 4 },
  tagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 3, fontWeight: '700' },
  title:   { fontSize: Layout.fontSize.xxxl, color: Colors.textPrimary, fontWeight: '800', letterSpacing: -0.5 },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginVertical: Layout.spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerStar: { color: Colors.gold, fontSize: 12 },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  infoTitle: { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '700', marginBottom: Layout.spacing.xs },
  infoRow:   { flexDirection: 'row', gap: Layout.spacing.sm, alignItems: 'flex-start' },
  infoIcon:  { fontSize: 14, marginTop: 1 },
  infoText:  { flex: 1, fontSize: Layout.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
