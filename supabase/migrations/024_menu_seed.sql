-- ============================================================
-- Migration 024 — Menu seed data (Breakfast, Classics, Drinks, Desserts)
-- Replaces the placeholder items from migration 023.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Clear old seed data so this is idempotent
delete from public.menu_items;

-- ============================================================
-- BREAKFAST
-- ============================================================
insert into public.menu_items
  (name, description, price, category, is_available, is_featured, image_url)
values
  (
    'Full Braxton Breakfast',
    'Free-range eggs your way, smoked back bacon, Cumberland sausage, grilled tomato, portobello mushroom, baked beans, sourdough toast',
    18.00, 'breakfast', true, true, null
  ),
  (
    'Eggs Benedict',
    'Two free-range poached eggs, shaved smoked ham, hollandaise sauce on a toasted English muffin',
    16.00, 'breakfast', true, true, null
  ),
  (
    'Avocado Toast',
    'Sourdough, smashed avocado, two poached eggs, chilli flakes, lemon, dukkah',
    14.00, 'breakfast', true, false, null
  ),
  (
    'Braxton Pancakes',
    'Buttermilk pancakes, whipped clotted cream, seasonal berry compote, maple syrup',
    13.00, 'breakfast', true, false, null
  ),
  (
    'Smoked Salmon Bagel',
    'Toasted sesame bagel, cream cheese, Scottish smoked salmon, capers, red onion, dill',
    16.00, 'breakfast', true, false, null
  ),
  (
    'Overnight Oats',
    'Rolled oats, oat milk, honey, toasted almonds, fresh mango, passion fruit',
    9.00, 'breakfast', true, false, null
  ),
  (
    'Shakshuka',
    'Spiced tomato and pepper sauce, two baked free-range eggs, feta, flatbread',
    15.00, 'breakfast', true, false, null
  ),
  -- is_available = false — used to confirm hiding works
  (
    'Seasonal Special Breakfast',
    'Chef''s daily breakfast special — ask your server for today''s creation',
    20.00, 'breakfast', false, false, null
  );


-- ============================================================
-- CLASSICS
-- ============================================================
insert into public.menu_items
  (name, description, price, category, is_available, is_featured, image_url)
values
  (
    'Braxton Beef Burger',
    '6oz dry-aged beef patty, aged cheddar, baby gem, beef tomato, pickles, house sauce, brioche bun, triple-cooked chips',
    20.00, 'classics', true, true, null
  ),
  (
    'Ribeye Steak',
    '10oz grass-fed ribeye, triple-cooked chips, watercress, peppercorn or béarnaise sauce',
    42.00, 'classics', true, true, null
  ),
  (
    'Fish & Chips',
    'Beer-battered North Sea cod, chunky chips, minted mushy peas, tartare sauce, lemon',
    22.00, 'classics', true, false, null
  ),
  (
    'Caesar Salad',
    'Romaine hearts, hand-made caesar dressing, 24-month Parmesan, white anchovies, sourdough croutons',
    15.00, 'classics', true, false, null
  ),
  (
    'Braxton Club Sandwich',
    'Triple-decker toasted sourdough, free-range chicken, smoked bacon, avocado, beefsteak tomato, aioli',
    18.00, 'classics', true, false, null
  ),
  (
    'Shepherd''s Pie',
    'Slow-braised lamb shoulder, root vegetables, rosemary jus, creamy mashed potato crust',
    24.00, 'classics', true, false, null
  ),
  (
    'Mushroom & Truffle Pasta',
    'Hand-rolled pappardelle, wild mushroom ragù, black truffle, 24-month Parmesan',
    22.00, 'classics', true, false, null
  ),
  (
    'Roasted Half Chicken',
    'Free-range chicken, herb butter, roasted garlic, triple-cooked chips, green salad',
    26.00, 'classics', true, false, null
  ),
  -- is_available = false
  (
    'Sunday Roast',
    'Available Sundays only — roast topside of beef, Yorkshire pudding, roast potatoes, seasonal vegetables, gravy',
    32.00, 'classics', false, false, null
  );


-- ============================================================
-- DRINKS
-- ============================================================
insert into public.menu_items
  (name, description, price, category, is_available, is_featured, image_url)
values
  (
    'Flat White',
    'Single origin espresso, silky steamed microfoam',
    5.50, 'drinks', true, false, null
  ),
  (
    'Matcha Latte',
    'Ceremonial grade matcha, oat milk, light honey',
    6.50, 'drinks', true, false, null
  ),
  (
    'Fresh Orange Juice',
    'Cold-pressed, served over ice',
    5.00, 'drinks', true, false, null
  ),
  (
    'Braxton Lemonade',
    'House-made lemonade, fresh mint, cucumber, sparkling water',
    6.00, 'drinks', true, false, null
  ),
  (
    'Braxton Old Fashioned',
    'Small-batch bourbon, house-made aromatic bitters, demerara, smoked orange peel',
    16.00, 'drinks', true, true, null
  ),
  (
    'Espresso Martini',
    'Grey Goose vodka, fresh double espresso, Kahlúa, sugar syrup',
    15.00, 'drinks', true, true, null
  ),
  (
    'Aperol Spritz',
    'Aperol, Prosecco DOC, soda water, blood orange slice',
    14.00, 'drinks', true, false, null
  ),
  (
    'Sommelier''s Wine Flight',
    'Three 75ml pours selected by our sommelier to pair with your meal — ask for today''s selection',
    42.00, 'drinks', true, false, null
  ),
  (
    'Seedlip Garden 108',
    'Non-alcoholic spirit, elderflower, cucumber, soda — a sophisticated alcohol-free option',
    10.00, 'drinks', true, false, null
  ),
  -- is_available = false
  (
    'Braxton Seasonal Cocktail',
    'Monthly rotation — ask your server for the current creation',
    17.00, 'drinks', false, false, null
  );


-- ============================================================
-- DESSERTS
-- ============================================================
insert into public.menu_items
  (name, description, price, category, is_available, is_featured, image_url)
values
  (
    'Chocolate Fondant',
    'Valrhona 70% dark chocolate, salted caramel ice cream, cocoa tuile',
    14.00, 'desserts', true, true, null
  ),
  (
    'Crème Brûlée',
    'Classic Madagascan vanilla, caramelised sugar crust, shortbread finger',
    12.00, 'desserts', true, false, null
  ),
  (
    'Sticky Toffee Pudding',
    'Medjool date sponge, warm toffee sauce, clotted cream ice cream',
    13.00, 'desserts', true, true, null
  ),
  (
    'Eton Mess',
    'Hand-broken meringue, chantilly cream, strawberries, passion fruit curd',
    11.00, 'desserts', true, false, null
  ),
  (
    'Braxton Sundae',
    'Three scoops of house-churned ice cream, hot chocolate fudge sauce, honeycomb, whipped cream',
    12.00, 'desserts', true, false, null
  ),
  (
    'British Cheese Board',
    'Selection of three British and French cheeses, membrillo, grapes, oat biscuits, celery',
    18.00, 'desserts', true, false, null
  ),
  (
    'Lemon Tart',
    'Crisp sweet pastry, sharp lemon curd, Italian meringue, raspberry coulis',
    12.00, 'desserts', true, false, null
  ),
  -- is_available = false
  (
    'Soufflé of the Day',
    'Ask your server — requires 20 minutes. Worth every second.',
    16.00, 'desserts', false, true, null
  );


-- ============================================================
-- VERIFY
-- Run this select to confirm counts per category
-- ============================================================
select
  category,
  count(*)                                        as total,
  count(*) filter (where is_available = true)     as available,
  count(*) filter (where is_available = false)    as hidden,
  count(*) filter (where is_featured = true)      as featured
from public.menu_items
group by category
order by category;
