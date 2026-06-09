import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Hamburger button — top right */}
      <TouchableOpacity
        style={[styles.hamburgerBtn, { top: insets.top + 16 }]}
        onPress={() => setDrawerOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.hamburgerLines}>
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
        </View>
      </TouchableOpacity>

      {/* Centered logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerBtn: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  hamburgerLines: {
    gap: 4,
    alignItems: 'flex-end',
  },
  line: {
    height: 1.5,
    width: 18,
    backgroundColor: Colors.textPrimary,
    borderRadius: 1,
  },
  lineShort: {
    width: 12,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
