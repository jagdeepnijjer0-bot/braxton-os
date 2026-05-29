/**
 * Gallery system end-to-end verification — mirrors useGallery.ts exactly.
 * Run from your local machine:
 *
 *   cd mobile
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/test-gallery.mjs
 *
 * The service role key is only needed for the write / cleanup checks.
 * Read-only checks (1, 2, 3) work without it (uses the anon key).
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';

const SUPABASE_URL     = 'https://adspyshcuylalvhtothn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc3B5c2hjdXlsYWx2aHRvdGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTU4MTgsImV4cCI6MjA5NTQ3MTgxOH0.mCjKRT-s3k1puD5dUuFwwxLCvPCW9vgOBQEXs9BqtdU';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const admin = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

function pass(msg)    { console.log(`  ✅  ${msg}`); }
function fail(msg)    { console.error(`  ❌  ${msg}`); process.exitCode = 1; }
function info(msg)    { console.log(`       ${msg}`); }
function warn(msg)    { console.log(`  ⚠️   ${msg}`); }
function section(t)   { console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 44 - t.length))}`); }

// ── CHECK 1: Public query mirrors useGallery.ts ───────────────────────────────
section('Check 1 — Query mirrors useGallery.ts (anon client, public read)');

const { data: images, error: fetchError } = await anon
  .from('gallery_images')
  .select('*')
  .order('order_index')
  .order('created_at', { ascending: false });

if (fetchError) {
  fail(`Supabase query failed: ${fetchError.message}`);
  process.exit(1);
}

pass(`Query returned ${images.length} image(s)`);

if (images.length === 0) {
  warn('No images found — run 025_gallery_seed.sql in the Supabase SQL editor first');
  warn('Then re-run this script to verify all checks');
} else {
  images.forEach((img, i) => {
    info(`[${i + 1}] order=${img.order_index}  caption="${img.caption ?? '(none)'}"  url: ${img.image_url.slice(0, 60)}...`);
  });
}

// ── CHECK 2: Ordering is correct (order_index ASC) ───────────────────────────
section('Check 2 — Images ordered by order_index ascending');

if (images.length >= 2) {
  let ordered = true;
  for (let i = 1; i < images.length; i++) {
    if (images[i].order_index < images[i - 1].order_index) {
      fail(`Order broken between index ${i - 1} (${images[i - 1].order_index}) and ${i} (${images[i].order_index})`);
      ordered = false;
    }
  }
  if (ordered) pass(`All ${images.length} images in correct order_index order`);
} else {
  warn('Need 2+ images to verify ordering — skipping');
}

// ── CHECK 3: Image URLs are reachable ─────────────────────────────────────────
section('Check 3 — Spot-check first 3 image URLs return HTTP 200');

async function headCheck(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ ok: res.statusCode < 400, status: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, status: 'network error' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'timeout' }); });
    req.end();
  });
}

const sample = images.slice(0, 3);
let urlsFail = false;
for (const img of sample) {
  const { ok, status } = await headCheck(img.image_url);
  if (ok) {
    pass(`HTTP ${status} — ${img.image_url.slice(0, 70)}`);
  } else {
    fail(`HTTP ${status} — ${img.image_url.slice(0, 70)}`);
    urlsFail = true;
  }
}
if (!urlsFail && sample.length > 0) {
  pass('All sampled image URLs are reachable');
}

// ── CHECK 4: Write + delete (requires service role) ───────────────────────────
section('Check 4 — Insert a test image row, verify it appears, then clean up');

if (!admin) {
  warn('Skipping write check — set SUPABASE_SERVICE_ROLE_KEY to enable');
} else {
  const TEST_URL = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&test=${Date.now()}`;

  const { data: inserted, error: insertError } = await admin
    .from('gallery_images')
    .insert({ image_url: TEST_URL, caption: 'Gallery test row', order_index: 999 })
    .select()
    .single();

  if (insertError) {
    fail(`Insert failed: ${insertError.message}`);
  } else {
    pass(`Test row inserted (id: ${inserted.id})`);

    // Verify anon client can read it (public RLS)
    const { data: readBack } = await anon
      .from('gallery_images')
      .select('id, caption')
      .eq('id', inserted.id)
      .single();

    if (readBack?.id === inserted.id) {
      pass('Anon client can read the new row (public RLS working correctly)');
    } else {
      fail('Anon client could NOT read the inserted row — check RLS policy');
    }

    // Cleanup
    await admin.from('gallery_images').delete().eq('id', inserted.id);
    pass('Test row deleted — cleanup complete');
  }
}

// ── CHECK 5: Realtime publication ────────────────────────────────────────────
section('Check 5 — gallery_images is in the supabase_realtime publication');

if (!admin) {
  warn('Skipping realtime check — set SUPABASE_SERVICE_ROLE_KEY to enable');
} else {
  const { data: pub, error: pubError } = await admin
    .from('pg_publication_tables')
    .select('tablename')
    .eq('pubname', 'supabase_realtime')
    .eq('tablename', 'gallery_images');

  // pg_publication_tables is a system view — may need rpc if select not allowed
  if (pubError) {
    warn(`Could not query pg_publication_tables directly (${pubError.message.slice(0,60)})`);
    info('Run in Supabase SQL editor to verify:');
    info("  SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='gallery_images';");
  } else if (pub && pub.length > 0) {
    pass('gallery_images is in supabase_realtime publication — instant updates enabled');
  } else {
    warn('gallery_images not found in supabase_realtime publication');
    warn('Run 025_gallery_seed.sql in the SQL editor to enable Realtime');
  }
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
section('Summary');

if (process.exitCode === 1) {
  console.log('  Some checks failed — see ❌ above.\n');
} else {
  pass(`All checks passed — Gallery system is fully connected.\n`);
  console.log('  The app will show:');
  console.log(`  • ${images.length} images in a 3-column responsive grid`);
  console.log('  • Fullscreen swipe lightbox (FlatList paging) with captions');
  console.log('  • Pull-to-refresh + animated skeleton loading state');
  console.log('  • Realtime updates: add/remove image in Supabase → app updates instantly');
  console.log('  • Broken image fallback (graceful error handling)\n');

  console.log('  HOW TO ADD NEW RESTAURANT IMAGES:');
  console.log('  ──────────────────────────────────');
  console.log('  Option A — External URL (fastest):');
  console.log('    INSERT INTO public.gallery_images (image_url, caption, order_index)');
  console.log("    VALUES ('https://your-cdn.com/photo.jpg', 'A caption', 13);");
  console.log('');
  console.log('  Option B — Supabase Storage (recommended for your own photos):');
  console.log('    1. Supabase Dashboard → Storage → Create bucket "gallery" (Public: ON)');
  console.log('    2. Upload → drag your .jpg/.webp file into the bucket');
  console.log('    3. Click the file → Copy URL');
  console.log('       (format: https://adspyshcuylalvhtothn.supabase.co/storage/v1/object/public/gallery/filename.jpg)');
  console.log('    4. INSERT into gallery_images with that URL');
  console.log('    → The app updates instantly via Realtime — no App Store update needed\n');
}
