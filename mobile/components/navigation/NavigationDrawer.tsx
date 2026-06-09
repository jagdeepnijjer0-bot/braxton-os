import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * Layout.drawerWidth;

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { membership, isPremium } = useMembership(user?.id);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  function navigate(path: string) {
    onClose();
    setTimeout(() => router.push(path as any), 50);
  }

  function handleSignOut() {
    onClose();
    setTimeout(() => {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut().catch(() => {}),
        },
      ]);
    }, 300);
  }

  return (
    <Modal transparent visible={isOpen} onRequestClose={onClose} animationType="none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
          { transform: [{ translateX }] },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* MY CAFÉ LOCCO — logged-in members only */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MY CAFÉ LOCCO</Text>
            <DrawerItem
              label={isPremium ? 'MY MEMBERSHIP' : 'MEMBERSHIP'}
              icon="♛"
              onPress={() => navigate(isPremium ? '/my-membership' : '/membership')}
              accent
            />
            {isPremium && (
              <DrawerItem
                label="CLAIM COFFEE"
                icon="☕"
                onPress={() => navigate('/coffee-claim')}
              />
            )}
            <DrawerItem
              label="MY RESERVATIONS"
              icon="🗓"
              onPress={() => navigate('/my-reservations')}
            />
          </View>
        )}

        {/* EXPLORE section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXPLORE</Text>
          <DrawerItem label="OUR STORY"    onPress={() => navigate('/about')} />
          <DrawerItem label="MENU"         onPress={() => navigate('/menu')} />
          <DrawerItem label="RESERVATIONS" onPress={() => navigate('/reservations')} />
          <DrawerItem label="GALLERY"      onPress={() => navigate('/gallery')} />
          {!isPremium && (
            <DrawerItem label="MEMBERSHIP" onPress={() => navigate('/membership')} />
          )}
          <DrawerItem label="CONTACT US"   onPress={() => navigate('/contact')} />
          <DrawerItem label="SOCIALS"      onPress={() => navigate('/social-media')} />
        </View>

        {/* Account section */}
        <View style={styles.bottomSection}>
          {isAuthenticated ? (
            <>
              <DrawerItem
                label="MY ACCOUNT"
                onPress={() => navigate('/account')}
              />
              <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
                <Text style={styles.signOutText}>SIGN OUT</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <DrawerItem label="SIGN IN"       onPress={() => navigate('/(auth)/login')} />
              <DrawerItem label="CREATE ACCOUNT" onPress={() => navigate('/(auth)/signup')} />
            </>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

function DrawerItem({
  label,
  icon,
  onPress,
  accent = false,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress} activeOpacity={0.6}>
      {icon ? <Text style={styles.drawerItemIcon}>{icon}</Text> : null}
      <Text style={[styles.drawerItemText, accent && styles.drawerItemAccent]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 1,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderCard,
    zIndex: 2,
    paddingHorizontal: 28,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: 32,
  },
  closeBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
    marginBottom: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  drawerItemIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  drawerItemText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '500',
  },
  drawerItemAccent: {
    color: Colors.gold,
  },
  bottomSection: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: Colors.borderCard,
    paddingTop: 24,
  },
  signOutBtn: {
    paddingVertical: 12,
    marginTop: 8,
  },
  signOutText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },
});
