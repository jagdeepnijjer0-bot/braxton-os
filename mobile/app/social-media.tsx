import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';

const SOCIALS = [
  {
    platform: 'INSTAGRAM',
    handle: '@cafelocco',
    url: 'https://www.instagram.com/cafelocco/',
    description: 'DAILY COFFEE · BEHIND THE SCENES · SEASONAL SPECIALS',
  },
  {
    platform: 'FACEBOOK',
    handle: 'LOCCO',
    url: 'https://www.facebook.com/p/LOCCO-100093893236137/',
    description: 'EVENTS · NEWS · COMMUNITY UPDATES',
  },
  {
    platform: 'TIKTOK',
    handle: '@cafelocco',
    url: 'https://www.tiktok.com/@cafelocco',
    description: 'SHORT FILMS · COFFEE CRAFT · LIFESTYLE',
  },
];

export default function SocialMediaScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function openLink(url: string, platform: string) {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open', `Please visit ${platform} directly.`);
      }
    } catch {
      Alert.alert('Cannot Open', `Please visit ${platform} directly.`);
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="SOCIALS" onMenuPress={() => setDrawerOpen(true)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.intro}>FOLLOW OUR JOURNEY AND JOIN THE COMMUNITY.</Text>

        {SOCIALS.map((social) => (
          <View key={social.platform} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.platform}>{social.platform}</Text>
              <Text style={styles.handle}>{social.handle}</Text>
            </View>
            <Text style={styles.description}>{social.description}</Text>
            <View style={styles.cardDivider} />
            <TouchableOpacity
              style={styles.followBtn}
              onPress={() => openLink(social.url, social.platform)}
              activeOpacity={0.7}
            >
              <Text style={styles.followBtnText}>FOLLOW ON {social.platform}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Community CTA */}
        <View style={styles.communityCard}>
          <Text style={styles.communityTitle}>JOIN OUR COMMUNITY</Text>
          <Text style={styles.communitySub}>
            EXCLUSIVE CONTENT · MEMBER EVENTS · EARLY ACCESS
          </Text>
          <TouchableOpacity
            style={styles.communityBtn}
            onPress={() => openLink('https://www.instagram.com/locco.365/', 'Instagram')}
            activeOpacity={0.8}
          >
            <Text style={styles.communityBtnText}>JOIN OUR COMMUNITY</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxxl,
  },
  intro: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 18,
    marginBottom: Layout.spacing.xs,
  },

  card: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.lg,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platform: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
  },
  handle: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
  },
  description: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 16,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderCard,
    marginVertical: 4,
  },
  followBtn: {
    paddingVertical: 12,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderCardStrong,
    alignItems: 'center',
  },
  followBtnText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '600',
  },

  // Community card
  communityCard: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: 10,
    marginTop: Layout.spacing.xs,
  },
  communityTitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
    textAlign: 'center',
  },
  communitySub: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    textAlign: 'center',
    lineHeight: 16,
  },
  communityBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.white,
  },
  communityBtnText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.background,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
  },
});
