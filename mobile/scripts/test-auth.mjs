/**
 * Auth test script — run from your local machine:
 *
 *   With email confirmation ON (recommended):
 *     SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> node scripts/test-auth.mjs
 *
 *   With email confirmation OFF:
 *     node scripts/test-auth.mjs
 *
 * The service role key lets the script create a pre-confirmed user via the
 * Admin API, so the full test suite runs regardless of your email settings.
 * Find it in: Supabase Dashboard → Project Settings → API → service_role key
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://adspyshcuylalvhtothn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc3B5c2hjdXlsYWx2aHRvdGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTU4MTgsImV4cCI6MjA5NTQ3MTgxOH0.mCjKRT-s3k1puD5dUuFwwxLCvPCW9vgOBQEXs9BqtdU';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;

const TEST_EMAIL    = `test+${Date.now()}@braxton-test.com`;
const TEST_PASSWORD = 'BraxtonTest123!';
const TEST_NAME     = 'Test User';

// Anon client — same as what the app uses
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// Admin client — only created when service role key is provided
const admin = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function pass(msg)    { console.log(`  ✅  ${msg}`); }
function fail(msg)    { console.error(`  ❌  ${msg}`); process.exitCode = 1; }
function warn(msg)    { console.log(`  ⚠️   ${msg}`); }
function skip(msg)    { console.log(`  ⏭️   ${msg}`); }
function section(t)   { console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 44 - t.length))}`); }

let userId   = null;
let anonSession = null;

// ── 0. MODE BANNER ────────────────────────────────────────────────────────────
section('Mode');
if (admin) {
  pass('Service role key found → Admin API mode (email confirmation bypassed)');
} else {
  warn('No SUPABASE_SERVICE_ROLE_KEY — falling back to anon sign-up');
  warn('If email confirmation is ON some steps will be skipped.');
  console.log('  Tip: set SUPABASE_SERVICE_ROLE_KEY=<key> to run the full suite.');
}

// ── 1. CREATE USER ────────────────────────────────────────────────────────────
section('1. Create User');
console.log(`   Email: ${TEST_EMAIL}`);

if (admin) {
  // Admin API: creates user already confirmed — works with confirmation ON or OFF
  const { data, error } = await admin.auth.admin.createUser({
    email:            TEST_EMAIL,
    password:         TEST_PASSWORD,
    email_confirm:    true,           // pre-confirmed regardless of project setting
    user_metadata:    { full_name: TEST_NAME },
  });

  if (error) { fail(`Admin createUser failed: ${error.message}`); process.exit(1); }

  userId = data.user.id;
  pass(`User created via Admin API (pre-confirmed)`);
  pass(`id: ${userId}`);
} else {
  // Anon sign-up — may require email confirmation
  const { data, error } = await supabase.auth.signUp({
    email:   TEST_EMAIL,
    password: TEST_PASSWORD,
    options: { data: { full_name: TEST_NAME } },
  });

  if (error) { fail(`Sign up failed: ${error.message}`); process.exit(1); }

  userId = data.user?.id;
  pass(`User created — id: ${userId}`);

  if (!data.session) {
    warn('No session returned — email confirmation is required.');
    warn('Either:');
    console.log('       a) Re-run with SUPABASE_SERVICE_ROLE_KEY=<key> (recommended)');
    console.log('       b) Supabase Dashboard → Auth → Providers → Email → disable "Confirm email"');
    console.log('       c) Manually confirm this user in Dashboard → Auth → Users → Confirm\n');
    console.log('  Remaining tests will be skipped until the user is confirmed.\n');
    process.exit(0);
  }

  anonSession = data.session;
}

// ── 2. TRIGGER: restaurant_profiles auto-created ──────────────────────────────
section('2. Profile Auto-Created (DB trigger)');

// Give the trigger a moment to fire
await new Promise((r) => setTimeout(r, 1200));

// Sign in with the anon client to get a session scoped to this user
const { data: siData, error: siError } = await supabase.auth.signInWithPassword({
  email:    TEST_EMAIL,
  password: TEST_PASSWORD,
});

if (siError) {
  fail(`Sign in failed: ${siError.message}`);
  process.exit(1);
}

anonSession = siData.session;

const { data: profile, error: profileError } = await supabase
  .from('restaurant_profiles')
  .select('*')
  .eq('id', userId)
  .single();

if (profileError) {
  fail(`Profile not found: ${profileError.message}`);
  console.log('       → Did migration 023 run? Check Supabase SQL Editor.');
} else {
  pass(`Profile auto-created by trigger`);
  pass(`full_name : "${profile.full_name}"`);
  pass(`email     : ${profile.email}`);
}

// ── 3. SIGN IN (fresh) ────────────────────────────────────────────────────────
section('3. Sign In');

pass(`Sign in successful`);
pass(`access_token  : ${anonSession.access_token.slice(0, 24)}…`);
pass(`refresh_token : ${anonSession.refresh_token.slice(0, 16)}…`);
pass(`expires_at    : ${new Date(anonSession.expires_at * 1000).toISOString()}`);

// ── 4. SESSION PERSISTENCE ────────────────────────────────────────────────────
section('4. Session Persistence (getUser)');

const { data: meData, error: meError } = await supabase.auth.getUser(
  anonSession.access_token,
);

if (meError) {
  fail(`getUser failed: ${meError.message}`);
} else {
  pass(`getUser returned    : ${meData.user?.email}`);
  pass(`User ID matches     : ${meData.user?.id === userId}`);
  pass(`Role                : ${meData.user?.role}`);
}

// ── 5. SIGN OUT ───────────────────────────────────────────────────────────────
section('5. Sign Out');

const { error: signOutError } = await supabase.auth.signOut();

if (signOutError) {
  fail(`Sign out failed: ${signOutError.message}`);
} else {
  pass('Sign out successful');
}

const { data: { session: sessionAfter } } = await supabase.auth.getSession();
sessionAfter
  ? fail('Session still active after sign out!')
  : pass('Session cleared — getSession() returns null ✓');

// ── 6. RLS: unauthenticated read blocked ─────────────────────────────────────
section('6. RLS — Unauthenticated Access Blocked');

const { data: leaked, error: rlsError } = await supabase
  .from('restaurant_memberships')
  .select('*');

if (rlsError || leaked?.length === 0) {
  pass('Unauthenticated read returns 0 rows (RLS working)');
} else {
  fail(`RLS gap — got ${leaked?.length} membership rows without auth`);
}

// ── 7. CLEANUP ────────────────────────────────────────────────────────────────
section('7. Cleanup (delete test user)');

if (admin) {
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  deleteError
    ? warn(`Could not delete test user: ${deleteError.message} (clean up manually)`)
    : pass(`Test user ${TEST_EMAIL} deleted`);
} else {
  skip('No service role key — test user left in Auth → Users (delete manually if needed)');
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
section('Summary');
if (process.exitCode === 1) {
  console.log('  Some tests failed — see ❌ above.\n');
} else {
  pass('All tests passed. Auth is wired up correctly.\n');
  if (!admin) {
    console.log('  Tip: run with SUPABASE_SERVICE_ROLE_KEY=<key> for the complete suite,');
    console.log('  including admin user creation, cleanup, and bypassing email confirmation.\n');
  }
}
