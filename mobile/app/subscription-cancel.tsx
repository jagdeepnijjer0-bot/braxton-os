import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';

export default function SubscriptionCancelScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.icon}>✕</Text>
        <Text style={styles.title}>Checkout Cancelled</Text>
        <Text style={styles.body}>
          No charge was made. You can subscribe whenever you're ready.
        </Text>
        <Button
          title="View Plans"
          onPress={() => router.replace('/membership')}
          fullWidth
          size="lg"
          style={{ marginTop: Layout.spacing.lg }}
        />
        <Button
          title="Continue Browsing"
          onPress={() => router.replace('/(tabs)/account')}
          variant="outline"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  icon:  { fontSize: 52, color: Colors.textMuted, textAlign: 'center' },
  title: { fontSize: Layout.fontSize.xxl, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  body:  { fontSize: Layout.fontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
