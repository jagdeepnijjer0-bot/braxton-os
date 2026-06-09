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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';

export default function EditProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();

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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT PROFILE</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>FULL NAME</Text>
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
            <Text style={styles.label}>PHONE</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+44 7700 900000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
            <Text style={styles.hint}>USED FOR RESERVATION CONFIRMATIONS ONLY.</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{loading ? 'SAVING…' : 'SAVE CHANGES'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  kav:  { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    height: Layout.headerHeight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCard,
  },
  headerSide: { width: 44, alignItems: 'flex-start' },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },

  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.lg,
  },

  fieldGroup: { gap: Layout.spacing.sm },

  label: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
    paddingHorizontal: Layout.spacing.sm,
  },

  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
  },

  hint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
    lineHeight: 16,
    paddingHorizontal: Layout.spacing.sm,
  },

  saveBtn: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
    marginTop: Layout.spacing.md,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: Colors.background,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },
});
