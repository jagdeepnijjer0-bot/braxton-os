import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

const { height } = Dimensions.get('window');

interface HeroSectionProps {
  onReserve: () => void;
  onMenu: () => void;
}

export function HeroSection({ onReserve, onMenu }: HeroSectionProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' }}
        style={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(10,10,10,0.5)', Colors.background]}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.tagline}>FINE DINING EXPERIENCE</Text>
            <Text style={styles.title}>Braxton</Text>
            <Text style={styles.subtitle}>
              Where every dish tells a story and{'\n'}every moment becomes a memory.
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={onReserve} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Reserve a Table</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onMenu} activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>View Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: height * 0.75 },
  image: { flex: 1 },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  content: { gap: Layout.spacing.md },
  tagline: {
    fontSize: Layout.fontSize.xs,
    color: Colors.gold,
    letterSpacing: 3,
    fontWeight: '600',
  },
  title: {
    fontSize: 56,
    color: Colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 60,
  },
  subtitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: Layout.fontSize.base,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 16,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: Layout.fontSize.base,
  },
});
