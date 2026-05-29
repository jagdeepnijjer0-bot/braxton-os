import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Text,
  FlatList,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { GalleryImage } from '@/lib/types';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - Layout.spacing.lg * 2 - Layout.spacing.sm * 2) / 3;
const FALLBACK_URI =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=60';

interface GalleryGridProps {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<FlatList<GalleryImage>>(null);

  function open(index: number) {
    setSelectedIndex(index);
  }

  function close() {
    setSelectedIndex(null);
  }

  function handleImageError(id: string) {
    setFailedIds((prev) => new Set(prev).add(id));
  }

  function onSwipeEnd(e: any) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setSelectedIndex(newIndex);
  }

  function renderLightboxSlide({ item }: ListRenderItemInfo<GalleryImage>) {
    return (
      <View style={styles.slide}>
        <Image
          source={{ uri: failedIds.has(item.id) ? FALLBACK_URI : item.image_url }}
          style={styles.fullImage}
          contentFit="contain"
          transition={150}
          onError={() => handleImageError(item.id)}
        />
        {item.caption ? (
          <Text style={styles.caption}>{item.caption}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <>
      {/* ── Grid ── */}
      <View style={styles.grid}>
        {images.map((img, index) => (
          <TouchableOpacity
            key={img.id}
            onPress={() => open(index)}
            activeOpacity={0.88}
            style={styles.item}
          >
            <Image
              source={{ uri: failedIds.has(img.id) ? FALLBACK_URI : img.image_url }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={250}
              onError={() => handleImageError(img.id)}
            />
            {img.caption ? (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionOverlayText} numberOfLines={1}>
                  {img.caption}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Fullscreen lightbox ── */}
      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <StatusBar backgroundColor="black" barStyle="light-content" />
        <View style={styles.lightbox}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={close}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {/* Page indicator */}
          {selectedIndex !== null && images.length > 1 && (
            <View style={styles.indicator}>
              <Text style={styles.indicatorText}>
                {selectedIndex + 1} / {images.length}
              </Text>
            </View>
          )}

          {/* Swipeable slides */}
          {selectedIndex !== null && (
            <FlatList
              ref={listRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedIndex}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              onMomentumScrollEnd={onSwipeEnd}
              renderItem={renderLightboxSlide}
              keyExtractor={(item) => item.id}
              decelerationRate="fast"
              bounces={false}
            />
          )}

          {/* Swipe hint on first open */}
          {selectedIndex !== null && images.length > 1 && (
            <View style={styles.swipeHint}>
              <Text style={styles.swipeHintText}>← swipe →</Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Grid
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
    backgroundColor: Colors.surface,
  },
  thumbnail: { width: '100%', height: '100%' },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  captionOverlayText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.white,
    fontWeight: '500',
  },

  // Lightbox
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.97)',
    justifyContent: 'center',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  fullImage: {
    width,
    height: width * 1.25,
  },
  caption: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.xl,
    lineHeight: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  indicator: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  indicatorText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});
