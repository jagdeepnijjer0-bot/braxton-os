import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { GalleryImage } from '@/lib/types';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - Layout.spacing.lg * 2 - Layout.spacing.sm * 2) / 3;

interface GalleryGridProps {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <>
      <View style={styles.grid}>
        {images.map((img, index) => (
          <TouchableOpacity
            key={img.id}
            onPress={() => setSelectedIndex(index)}
            activeOpacity={0.9}
            style={styles.item}
          >
            <Image
              source={{ uri: img.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={selected !== null} transparent animationType="fade" statusBarTranslucent>
        <StatusBar backgroundColor="black" barStyle="light-content" />
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedIndex(null)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {selected && (
            <View style={styles.fullImageContainer}>
              <Image
                source={{ uri: selected.image_url }}
                style={styles.fullImage}
                contentFit="contain"
              />
              {selected.caption && (
                <Text style={styles.caption}>{selected.caption}</Text>
              )}
            </View>
          )}
          {selectedIndex !== null && images.length > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                disabled={selectedIndex === 0}
              >
                <Text style={[styles.navText, selectedIndex === 0 && styles.navDisabled]}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>{selectedIndex + 1} / {images.length}</Text>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setSelectedIndex(Math.min(images.length - 1, selectedIndex + 1))}
                disabled={selectedIndex === images.length - 1}
              >
                <Text style={[styles.navText, selectedIndex === images.length - 1 && styles.navDisabled]}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  fullImageContainer: { width, alignItems: 'center', gap: Layout.spacing.md },
  fullImage: { width, height: width * 1.2 },
  caption: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  pagination: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xl,
  },
  navBtn: { padding: 8 },
  navText: { fontSize: 40, color: Colors.white, fontWeight: '300' },
  navDisabled: { opacity: 0.2 },
  pageIndicator: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary },
});
