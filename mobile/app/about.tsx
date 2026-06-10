import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';

const ADDRESS = process.env.EXPO_PUBLIC_RESTAURANT_ADDRESS ?? '';
const PHONE   = process.env.EXPO_PUBLIC_RESTAURANT_PHONE   ?? '';
const EMAIL   = process.env.EXPO_PUBLIC_RESTAURANT_EMAIL   ?? '';

const PILLARS = [
  {
    title: 'PREMIUM QUALITY',
    desc: 'EVERY INGREDIENT SOURCED WITH CARE. EVERY DISH CRAFTED WITH INTENTION.',
  },
  {
    title: 'COMMUNITY',
    desc: 'A GATHERING PLACE FOR THOSE WHO APPRECIATE THE FINER THINGS IN LIFE.',
  },
  {
    title: 'HOSPITALITY',
    desc: 'SERVICE THAT FEELS PERSONAL, WARM, AND EFFORTLESSLY REFINED.',
  },
];

export default function AboutScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.container}>
      <ScreenHeader title="OUR STORY" onMenuPress={() => setDrawerOpen(true)} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Story image */}
        <View style={styles.imageCard}>
          <Image
            source={require('../assets/images/story.png')}
            style={styles.storyImage}
            resizeMode="cover"
          />
        </View>

        {/* Our Story */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>OUR STORY</Text>
          <Text style={styles.cardText}>
            CAFÉ LOCCO BEGAN AS A VISION — A PLACE WHERE PREMIUM COFFEE AND ELEVATED
            HOSPITALITY MEET. BORN FROM A PASSION FOR CRAFT AND COMMUNITY, WE SET OUT
            TO CREATE MORE THAN A CAFÉ: A DESTINATION FOR THOSE WHO SEEK SOMETHING REFINED.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>OUR MISSION</Text>
          <Text style={styles.cardText}>
            TO DELIVER AN UNCOMPROMISING EXPERIENCE — FROM THE FIRST SIP OF YOUR MORNING
            COFFEE TO THE LAST BITE OF YOUR EVENING MEAL. EVERY DETAIL IS CONSIDERED.
            EVERY VISIT IS AN OCCASION.
          </Text>
        </View>

        {/* Vision */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>OUR VISION</Text>
          <Text style={styles.cardText}>
            TO BECOME THE DEFINING PREMIUM CAFÉ EXPERIENCE — A PLACE SYNONYMOUS WITH QUALITY,
            WARMTH, AND BELONGING. WHERE EVERY GUEST FEELS LIKE A MEMBER OF SOMETHING SPECIAL.
          </Text>
        </View>

        {/* Pillars */}
        {PILLARS.map((p) => (
          <View key={p.title} style={styles.pillarCard}>
            <Text style={styles.pillarTitle}>{p.title}</Text>
            <Text style={styles.pillarDesc}>{p.desc}</Text>
          </View>
        ))}

        {/* Location card */}
        {(ADDRESS || PHONE || EMAIL) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>FIND US</Text>
            {ADDRESS ? <Text style={styles.cardText}>📍  {ADDRESS}</Text> : null}
            {PHONE   ? <Text style={styles.cardText}>📞  {PHONE}</Text>   : null}
            {EMAIL   ? <Text style={styles.cardText}>✉️  {EMAIL}</Text>   : null}
          </View>
        ) : null}
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

  imageCard: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    overflow: 'hidden',
    height: 220,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },

  card: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.lg,
    gap: 12,
  },
  cardTitle: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
  },
  cardText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 18,
  },

  pillarCard: {
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.lg,
    gap: 10,
  },
  pillarTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    letterSpacing: Layout.letterSpacing.wider,
    fontWeight: '700',
  },
  pillarDesc: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.tight,
    lineHeight: 16,
  },
});
