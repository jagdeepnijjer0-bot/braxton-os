import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

const { width } = Dimensions.get('window');

const TEAM = [
  { name: 'James Braxton', role: 'Head Chef & Founder', emoji: '👨‍🍳' },
  { name: 'Sophie Laurent', role: 'Pastry Chef', emoji: '👩‍🍳' },
  { name: 'Marco Rossi', role: 'Sommelier', emoji: '🍷' },
];

const MILESTONES = [
  { year: '2010', event: 'Braxton opens its doors in Mayfair' },
  { year: '2013', event: 'First Michelin Star awarded' },
  { year: '2016', event: 'Named "Best Restaurant in London" by Time Out' },
  { year: '2019', event: 'Second Michelin Star + expansion' },
  { year: '2023', event: 'Launch of the Braxton Premium Membership' },
];

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' }}
          style={styles.hero}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', Colors.background]}
            locations={[0.4, 1]}
            style={styles.heroGradient}
          >
            <SafeAreaView edges={['top']}>
              <TouchableOpacity onPress={() => router.back()} style={styles.back}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            </SafeAreaView>
            <View style={styles.heroText}>
              <Text style={styles.tagline}>SINCE 2010</Text>
              <Text style={styles.heroTitle}>Our Story</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.content}>
          <Text style={styles.intro}>
            Braxton was born from a simple belief: that exceptional food, served in an
            atmosphere of warmth and elegance, has the power to bring people together
            and create memories that last a lifetime.
          </Text>

          <Text style={styles.body}>
            Founded by Chef James Braxton in the heart of Mayfair, our restaurant has
            grown from a intimate 20-seat dining room into one of London's most celebrated
            culinary destinations — while never forgetting the personal touch that made
            guests fall in love with us from day one.
          </Text>

          <Text style={styles.body}>
            We source our ingredients from small, sustainable farms across the British Isles,
            celebrating the seasons and the extraordinary produce our land has to offer.
            Every dish on our menu tells a story — of place, of season, of craft.
          </Text>

          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerStar}>✦</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.sectionTitle}>Our Journey</Text>
          <View style={styles.timeline}>
            {MILESTONES.map((m, i) => (
              <View key={m.year} style={styles.milestone}>
                <View style={styles.milestoneLeft}>
                  <Text style={styles.milestoneYear}>{m.year}</Text>
                  {i < MILESTONES.length - 1 && <View style={styles.milestoneLine} />}
                </View>
                <View style={styles.milestoneDot} />
                <Text style={styles.milestoneEvent}>{m.event}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerStar}>✦</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.sectionTitle}>Meet the Team</Text>
          <View style={styles.team}>
            {TEAM.map((member) => (
              <View key={member.name} style={styles.teamCard}>
                <View style={styles.teamAvatar}>
                  <Text style={styles.teamEmoji}>{member.emoji}</Text>
                </View>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            ))}
          </View>

          <View style={styles.quoteCard}>
            <Text style={styles.quoteMarks}>"</Text>
            <Text style={styles.quote}>
              Every meal at Braxton is an act of love — love for ingredients,
              for craft, and for the guests who trust us with their evenings.
            </Text>
            <Text style={styles.quoteAuthor}>— James Braxton</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Layout.spacing.xxxl },
  hero: { height: 340, width },
  heroGradient: { flex: 1, justifyContent: 'space-between', paddingBottom: Layout.spacing.xl },
  back: { margin: Layout.spacing.md },
  backText: { color: Colors.white, fontSize: Layout.fontSize.sm, opacity: 0.9 },
  heroText: { paddingHorizontal: Layout.spacing.lg, gap: 4 },
  tagline: { fontSize: Layout.fontSize.xs, color: Colors.gold, letterSpacing: 3, fontWeight: '600' },
  heroTitle: { fontSize: Layout.fontSize.xxxl, color: Colors.white, fontWeight: '800', letterSpacing: -0.5 },
  content: { padding: Layout.spacing.lg, gap: Layout.spacing.lg },
  intro: {
    fontSize: Layout.fontSize.lg,
    color: Colors.textPrimary,
    lineHeight: 30,
    fontStyle: 'italic',
  },
  body: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, lineHeight: 26 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm, marginVertical: Layout.spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerStar: { color: Colors.gold, fontSize: 12 },
  sectionTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  timeline: { gap: 0 },
  milestone: { flexDirection: 'row', gap: Layout.spacing.md, alignItems: 'flex-start' },
  milestoneLeft: { width: 44, alignItems: 'center' },
  milestoneYear: { fontSize: Layout.fontSize.sm, color: Colors.gold, fontWeight: '700' },
  milestoneLine: { width: 1, flex: 1, minHeight: 24, backgroundColor: Colors.border, marginVertical: 4 },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginTop: 4,
  },
  milestoneEvent: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    paddingBottom: Layout.spacing.md,
  },
  team: { flexDirection: 'row', gap: Layout.spacing.sm },
  teamCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  teamAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamEmoji: { fontSize: 24 },
  teamName: { fontSize: Layout.fontSize.sm, color: Colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  teamRole: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
  quoteCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  quoteMarks: { fontSize: 36, color: Colors.gold, lineHeight: 36, fontWeight: '700' },
  quote: { fontSize: Layout.fontSize.base, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 26 },
  quoteAuthor: { fontSize: Layout.fontSize.sm, color: Colors.gold, fontWeight: '600' },
});
