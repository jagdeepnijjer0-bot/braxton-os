import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, focused && styles.emojiFocused]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
          ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🍽️" label="Menu" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📸" label="Gallery" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Account" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Layout.tabBarHeight,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  tabIcon: { alignItems: 'center', gap: 2 },
  emoji: { fontSize: 22, opacity: 0.5 },
  emojiFocused: { opacity: 1 },
  tabLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  tabLabelFocused: { color: Colors.gold, fontWeight: '700' },
});
