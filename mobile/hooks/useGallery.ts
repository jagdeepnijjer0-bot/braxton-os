import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GalleryImage } from '@/lib/types';

export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery();

    // Realtime: any INSERT / UPDATE / DELETE on gallery_images refetches instantly
    const channel = supabase
      .channel('gallery_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery_images' },
        () => fetchGallery()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchGallery(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else if (!refreshing) setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('order_index')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setImages(data ?? []);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }

  return {
    images,
    loading,
    refreshing,
    error,
    refetch: fetchGallery,
    refresh: () => fetchGallery(true),
  };
}
