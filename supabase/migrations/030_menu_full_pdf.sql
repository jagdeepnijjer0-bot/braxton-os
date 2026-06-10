-- ============================================================
-- Migration 030 — Full Café Locco menu
-- Source of truth: live PDF (cafelocco.com/menu, 09/06/2026)
--                  + live website screenshots (same date)
-- Run AFTER migration 029 (adds dietary badge columns).
-- Replaces ALL existing menu data.
-- ============================================================
-- Categories (12):
--   Food:   breakfast, starters, kids, burgers, favourites,
--           sides, street-bowls, sweet-plates
--   Drinks: soft-drinks, mocktails, brew-bar, indulgence-bar
-- Total items: 95
--
-- Dietary badges confirmed from PDF/screenshots:
--   VEG (is_vegetarian) — shown with pink leaf icon on live menu
--   V   (is_vegan)      — shown with pink circle icon
--   GF  (is_gluten_free)— shown with pink wheat-cross icon
--
-- PRICE NOTES:
--   All food prices are exact (PDF at 400dpi, clearly readable).
--   Soft Drinks, Brew Bar, Indulgence Bar prices are estimated
--   from screenshot — verify with restaurant and update via
--   Supabase dashboard if needed.
-- ============================================================

DELETE FROM public.menu_items;

-- ============================================================
-- BREAKFAST (14 items)
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Locco Breakfast',            NULL, 14.00, 'breakfast', true, false, false, false, false, NULL),
  ('Gluten-Free Breakfast',      NULL, 14.00, 'breakfast', true, false, false, false, true,  NULL),
  ('Vegan Breakfast',            NULL, 14.00, 'breakfast', true, false, true,  true,  false, NULL),
  ('Avo Toast',                  NULL, 12.99, 'breakfast', true, false, true,  false, false, NULL),
  ('The Delicate Royale',        NULL, 15.00, 'breakfast', true, false, true,  false, false, NULL),
  ('Lamb Fritter Stack',         NULL, 15.49, 'breakfast', true, false, false, false, false, NULL),
  ('Veggie Breakfast',           NULL, 14.00, 'breakfast', true, false, true,  false, false, NULL),
  ('Traditional Desi Breakfast', NULL, 14.00, 'breakfast', true, false, false, false, false, NULL),
  ('Spice Me Up Scrambled',      NULL, 15.49, 'breakfast', true, false, false, false, false, NULL),
  ('Burrata Bruschetta',         NULL, 14.99, 'breakfast', true, false, true,  false, false, NULL),
  ('The Cheesy One',             NULL, 15.49, 'breakfast', true, false, false, false, false, NULL),
  ('Golden Corn Fritters',       NULL, 14.99, 'breakfast', true, false, false, false, false, NULL),
  ('Blush Açai Bowl',            NULL, 16.95, 'breakfast', true, false, false, false, false, NULL),
  ('Fruitful Granola',           NULL, 16.95, 'breakfast', true, false, false, false, false, NULL);

-- ============================================================
-- STARTERS (5 items)
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Paneer Pockets',                NULL, 10.00, 'starters', true, false, false, false, false, NULL),
  ('Lamb Gyozas',                   NULL, 10.00, 'starters', true, false, false, false, false, NULL),
  ('Samosa Chaat',                  NULL, 10.00, 'starters', true, false, true,  false, false, NULL),
  ('Salmon & Cream Cheese Canapé',  NULL, 10.00, 'starters', true, false, false, false, false, NULL),
  ('Bang Bang Prawns',              NULL, 10.00, 'starters', true, false, false, false, false, NULL);

-- ============================================================
-- LOCCO KIDS (3 items)
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Chicken Nuggets and Rustic Fries',               NULL, 10.00, 'kids', true, false, false, false, false, NULL),
  ('Pizza Bread and Rustic Fries – Cheese & Tomato', NULL, 10.00, 'kids', true, false, true,  false, false, NULL),
  ('Beef Burger and Rustic Fries',                   NULL, 10.00, 'kids', true, false, false, false, false, NULL);

-- ============================================================
-- BURGERS (4 items)
-- All served with seasoned rustic fries and house sauce.
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('The Wagyu',     'Served with seasoned rustic fries and house sauce', 21.00, 'burgers', true, false, false, false, false, NULL),
  ('The Inferno',   'Served with seasoned rustic fries and house sauce', 20.00, 'burgers', true, false, false, false, false, NULL),
  ('Veggie Crunch', 'Served with seasoned rustic fries and house sauce', 17.00, 'burgers', true, false, true,  false, false, NULL),
  ('Prawn Royale',  'Served with seasoned rustic fries and house sauce', 19.00, 'burgers', true, false, false, false, false, NULL);

-- ============================================================
-- FAVOURITES (12 items)
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Philly-Phully Loaded',         NULL, 23.00, 'favourites', true, false, false, false, false, NULL),
  ('Golden Yolk Bulgogi Toast',    NULL, 20.00, 'favourites', true, false, false, false, false, NULL),
  ('Jollof Lamb Chops',            NULL, 23.00, 'favourites', true, false, false, false, false, NULL),
  ('Lasagna Loaded Fries',         NULL, 17.49, 'favourites', true, false, false, false, false, NULL),
  ('The Chicken Deli',             NULL, 18.49, 'favourites', true, false, false, false, false, NULL),
  ('Chicken Parm',                 NULL, 22.00, 'favourites', true, false, false, false, false, NULL),
  ('The Bombay Melt',              NULL, 16.49, 'favourites', true, false, false, false, false, NULL),
  ('Jerk Chicken Pressed Bread',   NULL, 17.49, 'favourites', true, false, false, false, false, NULL),
  ('Masala Cod Tacos',             NULL, 17.99, 'favourites', true, false, false, false, false, NULL),
  ('Roasted Roots',                NULL, 16.99, 'favourites', true, false, false, false, false, NULL),
  ('Creamy Rigatoni',              NULL, 16.49, 'favourites', true, false, false, false, false, NULL),
  ('The Viral Caesar Crunch Wrap', NULL, 20.00, 'favourites', true, false, false, false, false, NULL);

-- ============================================================
-- SIDES (14 items)
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Waffle Fries',            NULL, 5.00, 'sides', true, false, false, false, false, NULL),
  ('Crispy Potato Bites',     NULL, 5.00, 'sides', true, false, false, false, false, NULL),
  ('Seasoned Rustic Fries',   NULL, 5.00, 'sides', true, false, false, false, false, NULL),
  ('Masala Rustic Fries',     NULL, 6.00, 'sides', true, false, false, false, false, NULL),
  ('Shokupan Toast',          NULL, 2.00, 'sides', true, false, false, false, false, NULL),
  ('Smashed Croissant',       NULL, 2.00, 'sides', true, false, false, false, false, NULL),
  ('Smashed Avocado',         NULL, 3.00, 'sides', true, false, false, false, false, NULL),
  ('Paratha or Puri',         NULL, 2.00, 'sides', true, false, false, false, false, NULL),
  ('Masala Chana',            NULL, 3.00, 'sides', true, false, false, false, false, NULL),
  ('House Keema',             NULL, 6.00, 'sides', true, false, false, false, false, NULL),
  ('Locco Beans',             NULL, 3.00, 'sides', true, false, false, false, false, NULL),
  ('Garlic & Chilli Spinach', NULL, 3.00, 'sides', true, false, false, false, false, NULL),
  ('Baby Buttoned Mushrooms', NULL, 3.00, 'sides', true, false, false, false, false, NULL),
  ('Badam Halwa',             NULL, 3.00, 'sides', true, false, false, false, false, NULL);

-- ============================================================
-- LOCCO STREET BOWLS (2 items)
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Chicken Butter Be Nice', '1050 kcal', 20.00, 'street-bowls', true, false, false, false, false, NULL),
  ('Locco Lamb Karahi',      '1150 kcal', 22.00, 'street-bowls', true, false, false, false, false, NULL);

-- ============================================================
-- SWEET PLATES (10 items)
-- Ferrero Tiramisu marked featured (shown with NEW badge on live menu).
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Pistachio Creme Leche Cake',     NULL, 12.00, 'sweet-plates', true, false, false, false, false, NULL),
  ('Tilda Cake',                     NULL, 13.00, 'sweet-plates', true, false, false, false, false, NULL),
  ('Carrot Cake',                    NULL, 13.00, 'sweet-plates', true, false, false, false, false, NULL),
  ('Ferrero Tiramisu',               NULL, 15.00, 'sweet-plates', true, true,  false, false, false, NULL),
  ('Raspberry & White Chocolate',    NULL, 12.00, 'sweet-plates', true, false, false, false, false, NULL),
  ('Dubai Knafeh',                   NULL, 15.00, 'sweet-plates', true, false, false, false, false, NULL),
  ('Le Douce Folie ''Sweet Madness''', NULL, 18.00, 'sweet-plates', true, false, false, false, false, NULL),
  ('Kinder Bueno Bites',             NULL, 15.00, 'sweet-plates', true, false, false, false, false, NULL),
  ('Biscoff Vegan Cheesecake',       NULL, 12.00, 'sweet-plates', true, false, true,  true,  false, NULL),
  ('Cappuccino Gluten-Free Cake',    NULL, 12.00, 'sweet-plates', true, false, false, false, true,  NULL);

-- ============================================================
-- SOFT DRINKS (7 items)
-- NOTE: Prices estimated from screenshot — verify with restaurant.
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Diet Coke',       NULL, 3.50, 'soft-drinks', true, false, false, false, false, NULL),
  ('Coke',            NULL, 3.50, 'soft-drinks', true, false, false, false, false, NULL),
  ('RedBull',         NULL, 4.50, 'soft-drinks', true, false, false, false, false, NULL),
  ('Still Water',     NULL, 3.00, 'soft-drinks', true, false, false, false, false, NULL),
  ('Sparkling Water', NULL, 3.00, 'soft-drinks', true, false, false, false, false, NULL),
  ('Ginger Ale',      NULL, 3.50, 'soft-drinks', true, false, false, false, false, NULL),
  ('Fruit Boost',     NULL, 4.00, 'soft-drinks', true, false, false, false, false, NULL);

-- ============================================================
-- MOCKTAILS (7 items)
-- Prices readable from screenshot.
-- Locco Punch marked featured (signature mocktail).
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Locco Punch',                      NULL, 11.00, 'mocktails', true, true,  false, false, false, NULL),
  ('Strawberry Mojito',                NULL, 11.00, 'mocktails', true, false, false, false, false, NULL),
  ('Coco Colada',                      NULL, 11.00, 'mocktails', true, false, false, false, false, NULL),
  ('Fresh Coconut',                    NULL,  9.00, 'mocktails', true, false, false, false, false, NULL),
  ('Açaí, Coconut and Mango Smoothie', NULL, 11.00, 'mocktails', true, false, false, false, false, NULL),
  ('Mango & Passion Maracuya',         NULL, 11.00, 'mocktails', true, false, false, false, false, NULL),
  ('White Whisper',                    NULL,  9.00, 'mocktails', true, false, false, false, false, NULL);

-- ============================================================
-- BREW BAR (10 items — teas and coffees)
-- NOTE: Prices estimated from screenshot — verify with restaurant.
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('English Breakfast',      NULL, 3.50, 'brew-bar', true, false, false, false, false, NULL),
  ('Moroccan Mint Tea',      NULL, 3.50, 'brew-bar', true, false, false, false, false, NULL),
  ('Pomegranate Green Tea',  NULL, 3.50, 'brew-bar', true, false, false, false, false, NULL),
  ('Spiced Apple Cinnamon',  NULL, 3.50, 'brew-bar', true, false, false, false, false, NULL),
  ('Chai',                   NULL, 4.00, 'brew-bar', true, false, false, false, false, NULL),
  ('Double Espresso',        NULL, 3.00, 'brew-bar', true, false, false, false, false, NULL),
  ('Flat White',             NULL, 4.00, 'brew-bar', true, false, false, false, false, NULL),
  ('Cappuccino',             NULL, 4.00, 'brew-bar', true, false, false, false, false, NULL),
  ('Americano',              NULL, 3.50, 'brew-bar', true, false, false, false, false, NULL),
  ('Macchiato',              NULL, 3.50, 'brew-bar', true, false, false, false, false, NULL);

-- ============================================================
-- INDULGENCE BAR (7 items — specialty drinks)
-- NOTE: Some item names and prices estimated from screenshot —
--       verify with restaurant.
-- ============================================================
INSERT INTO public.menu_items
  (name, description, price, category, is_available, is_featured,
   is_vegetarian, is_vegan, is_gluten_free, image_url)
VALUES
  ('Ginger Miso Oat Latte',               NULL,  7.00, 'indulgence-bar', true, false, false, false, false, NULL),
  ('Strawberry & Cream Matcha',           NULL,  7.00, 'indulgence-bar', true, false, false, false, false, NULL),
  ('Fresh Coconut Matcha',                NULL, 11.00, 'indulgence-bar', true, false, false, false, false, NULL),
  ('Dirty Cookie Milkshake',              NULL, 10.00, 'indulgence-bar', true, false, false, false, false, NULL),
  ('Pistachio Cream Spinner',             NULL, 10.00, 'indulgence-bar', true, false, false, false, false, NULL),
  ('Basic Cream Matcha',                  NULL,  7.00, 'indulgence-bar', true, false, false, false, false, NULL),
  ('Ferrero''s Chocolate Orange Shake',  NULL, 10.00, 'indulgence-bar', true, false, false, false, false, NULL);

-- ============================================================
-- VERIFY — expected totals:
--   12 categories, 95 items total
-- ============================================================
SELECT
  category,
  count(*)                                         AS total,
  count(*) FILTER (WHERE is_available  = true)     AS available,
  count(*) FILTER (WHERE is_featured   = true)     AS featured,
  count(*) FILTER (WHERE is_vegetarian = true)     AS veg,
  count(*) FILTER (WHERE is_vegan      = true)     AS vegan,
  count(*) FILTER (WHERE is_gluten_free = true)    AS gf
FROM public.menu_items
GROUP BY category
ORDER BY category;
