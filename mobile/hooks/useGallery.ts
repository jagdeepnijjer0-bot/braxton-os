import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GalleryImage } from '@/lib/types';

export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    setLoading(true);
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
    setLoading(false);
  }

  return { images, loading, error, refetch: fetchGallery };
}
