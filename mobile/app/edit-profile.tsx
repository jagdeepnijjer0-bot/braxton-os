import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function EditProfileScreen() {
  const { profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone,    setPhone]    = useState(profile?.phone    ?? '');
  const [loading,  setLoading]  = useState(false);

  async function handleSave() {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ full_name: trimmedName, phone: phone.trim() || null });
      router.back();
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message ?? 'Could not save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+44 7700 900000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
            <Text style={styles.hint}>Used for reservation confirmations only.</Text>
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: Layout.spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav:  { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 70 },
  backText: { fontSize: Layout.fontSize.base, color: Colors.gold, fontWeight: '600' },
  headerTitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
  },

  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },

  fieldGroup: { gap: Layout.spacing.xs },

  label: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
  },

  hint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
