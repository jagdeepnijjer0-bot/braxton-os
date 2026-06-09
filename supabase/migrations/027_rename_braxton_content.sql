-- ============================================================
-- Migration 027 — Remove "Braxton" from seeded content
-- Updates menu item names and gallery captions that reference
-- the old Braxton template branding.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Menu items ──────────────────────────────────────────────────────────────

UPDATE public.menu_items SET name = 'Full English Breakfast'
WHERE name = 'Full Braxton Breakfast';

UPDATE public.menu_items SET name = 'Buttermilk Pancakes'
WHERE name = 'Braxton Pancakes';

UPDATE public.menu_items SET name = 'House Beef Burger',
  description = '6oz dry-aged beef patty, aged cheddar, baby gem, beef tomato, pickles, house sauce, brioche bun, triple-cooked chips'
WHERE name = 'Braxton Beef Burger';

UPDATE public.menu_items SET name = 'House Club Sandwich',
  description = 'Triple-decker toasted sourdough, free-range chicken, smoked bacon, avocado, beefsteak tomato, aioli'
WHERE name = 'Braxton Club Sandwich';

UPDATE public.menu_items SET name = 'House Lemonade',
  description = 'House-made lemonade, fresh mint, cucumber, sparkling water'
WHERE name = 'Braxton Lemonade';

UPDATE public.menu_items SET name = 'House Old Fashioned',
  description = 'Small-batch bourbon, house-made aromatic bitters, demerara, smoked orange peel'
WHERE name = 'Braxton Old Fashioned';

UPDATE public.menu_items SET name = 'Seasonal Cocktail',
  description = 'Monthly rotation — ask your server for the current creation'
WHERE name = 'Braxton Seasonal Cocktail';

UPDATE public.menu_items SET name = 'House Sundae',
  description = 'Three scoops of house-churned ice cream, hot chocolate fudge sauce, honeycomb, whipped cream'
WHERE name = 'Braxton Sundae';

-- ── Gallery captions ────────────────────────────────────────────────────────

UPDATE public.gallery_images SET caption = 'Intimate evenings at Cafe Locco'
WHERE caption = 'Intimate evenings at Braxton';

-- ── Verify ──────────────────────────────────────────────────────────────────
-- Run this to confirm no "Braxton" remains in menu or gallery:
SELECT 'menu_items' AS tbl, count(*) AS braxton_count
  FROM public.menu_items WHERE name ILIKE '%braxton%'
UNION ALL
SELECT 'gallery_images', count(*)
  FROM public.gallery_images WHERE caption ILIKE '%braxton%';
