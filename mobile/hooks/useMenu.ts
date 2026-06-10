import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, MenuCategory } from '@/lib/types';

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('all');

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('category')
      .order('name');
    if (error) {
      setError(error.message);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }

  const featured = items.filter((i) => i.is_featured);

  const filtered =
    activeCategory === 'all'
      ? items
      : items.filter((i) => i.category === activeCategory);

  const categories: MenuCategory[] = ['all', ...Array.from(new Set(items.map((i) => i.category as MenuCategory)))];

  return {
    items,
    featured,
    filtered,
    categories,
    activeCategory,
    setActiveCategory,
    loading,
    error,
    refetch: fetchMenu,
  };
}
