-- ============================================================
-- Migration 028 — Real Café Locco menu data
-- Replaces all placeholder items with the actual restaurant menu.
-- ============================================================

-- Clear all existing menu items (idempotent)
DELETE FROM public.menu_items;

-- ============================================================
-- BREAKFAST
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Locco Breakfast',            NULL, 13.49, 'breakfast', true, true,  null),
  ('Traditional Desi Breakfast', NULL, 13.49, 'breakfast', true, false, null),
  ('Veggie Breakfast',           NULL, 13.49, 'breakfast', true, false, null),
  ('Vegan Breakfast',            NULL, 13.49, 'breakfast', true, false, null),
  ('Gluten-Free Breakfast',      NULL, 13.49, 'breakfast', true, false, null);

-- ============================================================
-- CLASSICS
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Avo Toast',                    NULL, 12.99, 'classics', true, false, null),
  ('Tunacado',                     NULL, 13.49, 'classics', true, false, null),
  ('Mushroom Avo',                 NULL, 13.49, 'classics', true, false, null),
  ('The Royale',                   NULL, 13.99, 'classics', true, true,  null),
  ('Chilli-Garlic Florentine',     NULL, 13.99, 'classics', true, false, null),
  ('Sweet & Sour Crispy Chicken',  NULL, 13.99, 'classics', true, false, null),
  ('Spice Me Up Scrambled',        NULL, 12.49, 'classics', true, false, null),
  ('Nutty Shakshuka',              NULL, 13.49, 'classics', true, false, null),
  ('Huevos Rancheros',             NULL, 13.99, 'classics', true, false, null);

-- ============================================================
-- APPETISERS
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Buffalo Wings',    NULL,  9.49, 'appetisers', true, false, null),
  ('Halloumi Fries',   NULL,  8.99, 'appetisers', true, false, null),
  ('Dynamite Prawns',  NULL,  9.99, 'appetisers', true, true,  null),
  ('Poppin Poppers',   NULL,  8.49, 'appetisers', true, false, null),
  ('Calamari',         NULL,  9.49, 'appetisers', true, false, null),
  ('Loaded Fries',     NULL,  7.99, 'appetisers', true, false, null);

-- ============================================================
-- BOWLS
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Korean BBQ Bowl',        NULL, 14.49, 'bowls', true, false, null),
  ('Teriyaki Salmon Bowl',   NULL, 15.99, 'bowls', true, true,  null),
  ('Falafel Bowl',           NULL, 13.49, 'bowls', true, false, null),
  ('Peri Peri Chicken Bowl', NULL, 14.49, 'bowls', true, false, null);

-- ============================================================
-- FAVOURITES
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Fish & Chips',      NULL, 16.99, 'favourites', true, true,  null),
  ('Chicken & Waffles', NULL, 15.49, 'favourites', true, false, null),
  ('Mac & Cheese',      NULL, 12.99, 'favourites', true, false, null),
  ('Steak & Fries',     NULL, 22.99, 'favourites', true, true,  null);

-- ============================================================
-- BURGERS
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Locco Burger',              NULL, 14.99, 'burgers', true, true,  null),
  ('Buttermilk Chicken Burger', NULL, 14.49, 'burgers', true, false, null),
  ('Halloumi Burger',           NULL, 13.99, 'burgers', true, false, null),
  ('Beyond Burger',             NULL, 14.99, 'burgers', true, false, null),
  ('BBQ Bacon Burger',          NULL, 15.99, 'burgers', true, false, null);

-- ============================================================
-- WRAPS
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Chicken Caesar Wrap',    NULL, 11.99, 'wraps', true, false, null),
  ('Falafel Wrap',           NULL, 10.99, 'wraps', true, false, null),
  ('Peri Peri Chicken Wrap', NULL, 11.99, 'wraps', true, false, null),
  ('Halloumi Wrap',          NULL, 10.99, 'wraps', true, false, null);

-- ============================================================
-- KIDS (LOCCO KIDS)
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Kids Pancakes',        NULL, 6.99, 'kids', true, false, null),
  ('Kids Chicken Nuggets', NULL, 7.99, 'kids', true, false, null),
  ('Kids Fish Fingers',    NULL, 7.99, 'kids', true, false, null),
  ('Kids Mac & Cheese',    NULL, 6.99, 'kids', true, false, null),
  ('Kids Burger',          NULL, 8.49, 'kids', true, false, null);

-- ============================================================
-- SIDES
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Chips',              NULL, 4.49, 'sides', true, false, null),
  ('Sweet Potato Fries', NULL, 4.99, 'sides', true, false, null),
  ('Onion Rings',        NULL, 4.49, 'sides', true, false, null),
  ('Garlic Bread',       NULL, 3.99, 'sides', true, false, null),
  ('Side Salad',         NULL, 3.99, 'sides', true, false, null),
  ('Coleslaw',           NULL, 2.99, 'sides', true, false, null);

-- ============================================================
-- SWEETS (SWEET PLATES)
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Pancake Stack',  NULL, 10.99, 'sweets', true, false, null),
  ('French Toast',   NULL, 10.99, 'sweets', true, false, null),
  ('Waffles',        NULL, 11.49, 'sweets', true, true,  null),
  ('Brownie Sundae', NULL,  8.99, 'sweets', true, false, null),
  ('Cheesecake',     NULL,  7.99, 'sweets', true, false, null);

-- ============================================================
-- DRINKS (DRINK EDIT)
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Espresso',       NULL, 2.99, 'drinks', true, false, null),
  ('Americano',      NULL, 3.49, 'drinks', true, false, null),
  ('Cappuccino',     NULL, 3.99, 'drinks', true, false, null),
  ('Latte',          NULL, 3.99, 'drinks', true, false, null),
  ('Flat White',     NULL, 3.99, 'drinks', true, true,  null),
  ('Mocha',          NULL, 4.49, 'drinks', true, false, null),
  ('Hot Chocolate',  NULL, 3.99, 'drinks', true, false, null),
  ('Tea',            NULL, 2.99, 'drinks', true, false, null),
  ('Iced Latte',     NULL, 4.49, 'drinks', true, false, null),
  ('Iced Americano', NULL, 3.99, 'drinks', true, false, null);

-- ============================================================
-- SOFT DRINKS
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Coca-Cola',        NULL, 3.49, 'soft-drinks', true, false, null),
  ('Diet Coke',        NULL, 3.49, 'soft-drinks', true, false, null),
  ('Sprite',           NULL, 3.49, 'soft-drinks', true, false, null),
  ('Fanta',            NULL, 3.49, 'soft-drinks', true, false, null),
  ('Orange Juice',     NULL, 3.99, 'soft-drinks', true, false, null),
  ('Apple Juice',      NULL, 3.99, 'soft-drinks', true, false, null),
  ('Still Water',      NULL, 2.49, 'soft-drinks', true, false, null),
  ('Sparkling Water',  NULL, 2.49, 'soft-drinks', true, false, null);

-- ============================================================
-- MOCKTAILS
-- ============================================================
INSERT INTO public.menu_items (name, description, price, category, is_available, is_featured, image_url) VALUES
  ('Virgin Mojito',              NULL, 10.00, 'mocktails', true, false, null),
  ('Strawberry Daiquiri',        NULL, 10.00, 'mocktails', true, false, null),
  ('Pina Colada',                NULL, 10.00, 'mocktails', true, false, null),
  ('Coco Colada',                NULL, 10.00, 'mocktails', true, false, null),
  ('Mango Lassi',                NULL, 10.00, 'mocktails', true, false, null),
  ('Mango Ginger & Lychee Cooler', NULL, 10.00, 'mocktails', true, false, null),
  ('Ocean Wave',                 NULL, 10.00, 'mocktails', true, false, null),
  ('White Whisper',              NULL, 10.00, 'mocktails', true, false, null),
  ('Kiwi Spritz',                NULL, 10.00, 'mocktails', true, false, null),
  ('Locco Punch',                NULL, 12.00, 'mocktails', true, true,  null);

-- ============================================================
-- VERIFY
-- ============================================================
SELECT
  category,
  count(*)                                     AS total,
  count(*) FILTER (WHERE is_available = true)  AS available,
  count(*) FILTER (WHERE is_featured  = true)  AS featured
FROM public.menu_items
GROUP BY category
ORDER BY category;
