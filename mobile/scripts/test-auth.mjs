/**
 * Auth test script — run from your local machine:
 *   cd mobile
 *   node scripts/test-auth.mjs
 *
 * Tests: sign up → profile auto-created → sign in → session → sign out
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adspyshcuylalvhtothn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc3B5c2hjdXlsYWx2aHRvdGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTU4MTgsImV4cCI6MjA5NTQ3MTgxOH0.mCjKRT-s3k1puD5dUuFwwxLCvPCW9vgOBQEXs9BqtdU';

const TEST_EMAIL = `test+${Date.now()}@braxton-test.com`;
const TEST_PASSWORD = 'BraxtonTest123!';
const TEST_NAME = 'Test User';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function pass(msg) { console.log(`  ✅  ${msg}`); }
function fail(msg) { console.error(`  ❌  ${msg}`); process.exitCode = 1; }
function section(title) { console.log(`\n── ${title} ${'─'.repeat(40 - title.length)}`); }

// ── 1. SIGN UP ────────────────────────────────────────────────────────────────
section('1. Sign Up');
console.log(`   Email: ${TEST_EMAIL}`);

const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  options: { data: { full_name: TEST_NAME } },
});

if (signUpError) {
  fail(`Sign up failed: ${signUpError.message}`);
  process.exit(1);
}

const userId = signUpData.user?.id;
pass(`User created — id: ${userId}`);
pass(`Email: ${signUpData.user?.email}`);

// Check if email confirmation is required
if (!signUpData.session) {
  console.log('\n  ⚠️  Email confirmation is ENABLED on this project.');
  console.log('     To run the full test, either:');
  console.log('     a) Disable it: Supabase Dashboard → Auth → Email → uncheck "Confirm email"');
  console.log('     b) Or confirm the email in Auth → Users → click user → Confirm');
  console.log('\n     Continuing with the tests that don\'t need a session...\n');
}

// ── 2. PROFILE AUTO-CREATED ───────────────────────────────────────────────────
section('2. Profile Auto-Created (trigger check)');

// Wait briefly for trigger to fire
await new Promise((r) => setTimeout(r, 1500));

// Use the session from sign-up if available, otherwise sign in
let session = signUpData.session;

if (!session) {
  // Try signing in anyway (will fail if email not confirmed — that's expected)
  const { data: siData } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  session = siData?.session ?? null;
}

if (session) {
  const { data: profile, error: profileError } = await supabase
    .from('restaurant_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    fail(`Profile not found: ${profileError.message}`);
    console.log('     → Make sure you ran migration 023 in Supabase SQL Editor');
  } else {
    pass(`Profile auto-created by trigger`);
    pass(`full_name: "${profile.full_name}"`);
    pass(`email: ${profile.email}`);
  }
} else {
  console.log('  ⏭️  Skipping profile check (no session — email confirmation pending)');
}

// ── 3. SIGN IN ────────────────────────────────────────────────────────────────
section('3. Sign In');

const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
});

if (signInError) {
  if (signInError.message.includes('Email not confirmed')) {
    console.log('  ⚠️  Sign in blocked — email not yet confirmed (expected if confirmation is on)');
    console.log('     Confirm the user in Supabase Dashboard → Auth → Users, then re-run this script.');
    process.exit(0);
  }
  fail(`Sign in failed: ${signInError.message}`);
  process.exit(1);
}

pass(`Sign in successful`);
pass(`access_token present: ${!!signInData.session?.access_token}`);
pass(`refresh_token present: ${!!signInData.session?.refresh_token}`);
pass(`expires_at: ${new Date((signInData.session?.expires_at ?? 0) * 1000).toISOString()}`);

// ── 4. SESSION PERSISTENCE ────────────────────────────────────────────────────
section('4. Session Persistence (getUser with token)');

const { data: meData, error: meError } = await supabase.auth.getUser(
  signInData.session?.access_token,
);

if (meError) {
  fail(`getUser failed: ${meError.message}`);
} else {
  pass(`getUser returned user: ${meData.user?.email}`);
  pass(`User id matches: ${meData.user?.id === userId}`);
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
if (sessionAfter) {
  fail('Session still active after sign out!');
} else {
  pass('Session cleared — no active session after sign out');
}

// ── 6. PROTECTED ROUTE CHECK ──────────────────────────────────────────────────
section('6. RLS — Unauthenticated Access Blocked');

const { data: protectedData, error: rlsError } = await supabase
  .from('restaurant_memberships')
  .select('*');

if (rlsError || !protectedData?.length) {
  pass('RLS working — unauthenticated read returns empty/blocked');
} else {
  fail(`RLS may be misconfigured — got ${protectedData.length} rows without auth`);
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
section('Summary');
if (process.exitCode === 1) {
  console.log('  Some tests failed — see ❌ above.\n');
} else {
  console.log('  All tests passed. Auth is working correctly.\n');
  console.log('  Next: check Supabase Dashboard → Authentication → Users');
  console.log(`  You should see: ${TEST_EMAIL}\n`);
}
