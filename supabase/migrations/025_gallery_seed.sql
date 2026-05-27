-- ============================================================
-- Gallery seed: 12 demo images + Realtime enabled
-- Run AFTER 023_restaurant_schema.sql
-- ============================================================

-- Clear any existing seed rows so this is idempotent
DELETE FROM public.gallery_images
WHERE image_url LIKE '%unsplash.com%';

-- 12 premium restaurant photos from Unsplash (stable CDN URLs)
INSERT INTO public.gallery_images (image_url, caption, order_index) VALUES

-- Interior / ambiance
('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
 'Our dining room — warmth in every detail', 1),

('https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
 'Intimate evenings at Braxton', 2),

('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
 'Where every seat tells a story', 3),

-- Food plating
('https://images.unsplash.com/photo-1544025162-d76538b2a20b?w=800&q=80',
 'Prime cut — aged 28 days, cooked to perfection', 4),

('https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
 'Seasonal ingredients, crafted daily', 5),

('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
 'Fresh from the kitchen', 6),

('https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
 'Seafood special — sourced the same morning', 7),

-- Desserts
('https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
 'Indulge — our pastry chef insists', 8),

('https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
 'Sunday brunch — the week''s best start', 9),

-- Cocktails / bar
('https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80',
 'The bar is always open', 10),

('https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=800&q=80',
 'Wine chosen for every moment', 11),

-- Team / atmosphere
('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
 'Garden freshness — delivered to your table', 12);

-- ── Enable Realtime so the app updates instantly on any change ────────────────
ALTER TABLE public.gallery_images REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_images;
EXCEPTION WHEN others THEN
  NULL; -- already in publication
END;
$$;
