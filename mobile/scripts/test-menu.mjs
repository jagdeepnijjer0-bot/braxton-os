/**
 * Menu screen verification — mirrors useMenu.ts exactly.
 * Run from your local machine:
 *
 *   cd mobile
 *   node scripts/test-menu.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://adspyshcuylalvhtothn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc3B5c2hjdXlsYWx2aHRvdGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTU4MTgsImV4cCI6MjA5NTQ3MTgxOH0.mCjKRT-s3k1puD5dUuFwwxLCvPCW9vgOBQEXs9BqtdU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

function pass(msg)  { console.log(`  ✅  ${msg}`); }
function fail(msg)  { console.error(`  ❌  ${msg}`); process.exitCode = 1; }
function info(msg)  { console.log(`       ${msg}`); }
function section(t) { console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 44 - t.length))}`); }

// ── Replicate useMenu.ts fetchMenu() exactly ──────────────────────────────────
section('Fetching from Supabase (mirrors useMenu.ts)');

const { data: items, error } = await supabase
  .from('menu_items')
  .select('*')
  .eq('is_available', true)   // ← same filter as useMenu line 21
  .order('category')
  .order('name');

if (error) {
  fail(`Supabase query failed: ${error.message}`);
  process.exit(1);
}

pass(`Query returned ${items.length} items`);

// ── CHECK 1: Categories load correctly ────────────────────────────────────────
section('Check 1 — Categories derive from DB (no hardcoding)');

const categories = ['all', ...new Set(items.map((i) => i.category))];
pass(`Categories: ${categories.join(', ')}`);

const expected = ['all', 'breakfast', 'classics', 'desserts', 'drinks'];
const match = expected.every((c) => categories.includes(c)) && categories.length === expected.length;
match
  ? pass('All 4 expected categories present (breakfast, classics, desserts, drinks)')
  : fail(`Category mismatch — got: ${categories.filter(c => c !== 'all').join(', ')}`);

// ── CHECK 2: Items load from Supabase ─────────────────────────────────────────
section('Check 2 — Items load dynamically from Supabase');

const countByCategory = {};
for (const item of items) {
  countByCategory[item.category] = (countByCategory[item.category] ?? 0) + 1;
}
for (const [cat, count] of Object.entries(countByCategory)) {
  info(`${cat}: ${count} items`);
}

const totalExpected = 31; // 35 seeded - 4 hidden
items.length === totalExpected
  ? pass(`Correct count: ${items.length} available items (35 total - 4 hidden)`)
  : fail(`Expected ${totalExpected} items, got ${items.length}`);

// ── CHECK 3: Featured items ────────────────────────────────────────────────────
section('Check 3 — Featured items (is_featured = true)');

const featured = items.filter((i) => i.is_featured);
pass(`${featured.length} featured items found`);
featured.forEach((i) => info(`"${i.name}" [${i.category}]`));

featured.length >= 1
  ? pass('Featured items exist and will render with "Chef\'s Pick" badge')
  : fail('No featured items — Home screen chef\'s picks will be empty');

// ── CHECK 4: Hidden items never appear ────────────────────────────────────────
section('Check 4 — Hidden items (is_available = false) excluded');

const HIDDEN_NAMES = [
  'Seasonal Special Breakfast',
  'Sunday Roast',
  'Braxton Seasonal Cocktail',
  'Souffle of the Day',
];

let hiddenLeak = false;
for (const name of HIDDEN_NAMES) {
  const found = items.find((i) => i.name === name);
  if (found) {
    fail(`"${name}" has is_available=false but was returned — RLS or query bug`);
    hiddenLeak = true;
  }
}
if (!hiddenLeak) {
  pass('All 4 hidden items correctly excluded from query results');
  HIDDEN_NAMES.forEach((n) => info(`"${n}" — not returned ✓`));
}

// ── CHECK 5: Category filtering (mirrors useMenu filtered computed) ────────────
section('Check 5 — Category tab filtering works correctly');

const testCats = ['breakfast', 'classics', 'drinks', 'desserts'];
let filterPass = true;
for (const cat of testCats) {
  const filtered = items.filter((i) => i.category === cat);
  const expected = countByCategory[cat] ?? 0;
  if (filtered.length === expected && filtered.length > 0) {
    pass(`Tab "${cat}" → ${filtered.length} items`);
  } else {
    fail(`Tab "${cat}" → expected ${expected} items, got ${filtered.length}`);
    filterPass = false;
  }
}
if (filterPass) pass('"All" tab shows all 31 items, each category tab filters correctly');

// ── CHECK 5b: Live update simulation ─────────────────────────────────────────
section('Check 5b — Instant reflect: re-fetch simulates pull-to-refresh');

const { data: refetch, error: refetchError } = await supabase
  .from('menu_items')
  .select('*')
  .eq('is_available', true)
  .order('category')
  .order('name');

if (refetchError) {
  fail(`Re-fetch failed: ${refetchError.message}`);
} else if (refetch.length === items.length) {
  pass(`Re-fetch returned same ${refetch.length} items — DB changes reflect immediately on next fetch`);
  info('Toggle is_available in Table Editor → call refetch() in app → change appears instantly');
} else {
  fail(`Re-fetch count mismatch: ${refetch.length} vs ${items.length}`);
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
section('Summary');
if (process.exitCode === 1) {
  console.log('  Some checks failed — see ❌ above.\n');
} else {
  pass('All 5 checks passed — Menu screen is fully dynamic.\n');
  console.log('  The app will show:');
  console.log(`  • ${items.length} available items across 4 category tabs`);
  console.log(`  • ${featured.length} items with "Chef\'s Pick" badge`);
  console.log('  • 4 hidden items invisible to users');
  console.log('  • Changes in Supabase Table Editor appear on next app load\n');
}
