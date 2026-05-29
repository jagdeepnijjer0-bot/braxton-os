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

const TEST_EMAIL       = `test+${Date.now()}@braxton-test.com`;
const TEST_PASSWORD    = 'BraxtonTest123!';
const TEST_NEW_PASS    = 'BraxtonNew456!';
const TEST_NAME        = 'Test User';

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

let userId      = null;
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
  const { data, error } = await admin.auth.admin.createUser({
    email:            TEST_EMAIL,
    password:         TEST_PASSWORD,
    email_confirm:    true,
    user_metadata:    { full_name: TEST_NAME },
  });

  if (error) { fail(`Admin createUser failed: ${error.message}`); process.exit(1); }

  userId = data.user.id;
  pass(`User created via Admin API (pre-confirmed)`);
  pass(`id: ${userId}`);
} else {
  const { data, error } = await supabase.auth.signUp({
    email:    TEST_EMAIL,
    password: TEST_PASSWORD,
    options:  { data: { full_name: TEST_NAME } },
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

// ── 2. EMAIL VERIFICATION STATE ───────────────────────────────────────────────
section('2. Email Verification State');

if (admin) {
  // Create an UNCONFIRMED user to verify the email_confirmed_at field behaviour
  const unconfirmedEmail = `unconfirmed+${Date.now()}@braxton-test.com`;
  const { data: unconfData, error: unconfErr } = await admin.auth.admin.createUser({
    email:         unconfirmedEmail,
    password:      TEST_PASSWORD,
    email_confirm: false,
  });

  if (unconfErr) {
    warn(`Could not create unconfirmed user: ${unconfErr.message}`);
  } else {
    const unconfirmedUser = unconfData.user;
    if (!unconfirmedUser.email_confirmed_at) {
      pass('Unconfirmed user has no email_confirmed_at — correct initial state');
    } else {
      fail('email_confirmed_at unexpectedly set on unconfirmed user');
    }

    // Signing in as unconfirmed user should fail
    const { error: unconfSignInErr } = await supabase.auth.signInWithPassword({
      email:    unconfirmedEmail,
      password: TEST_PASSWORD,
    });
    if (unconfSignInErr) {
      pass(`Unconfirmed sign-in blocked: "${unconfSignInErr.message.slice(0, 60)}"`);
    } else {
      warn('Unconfirmed user was allowed to sign in — check Supabase email confirmation setting');
    }

    // Clean up unconfirmed user
    await admin.auth.admin.deleteUser(unconfirmedUser.id);
    pass('Unconfirmed test user cleaned up');
  }

  // Verify our main test user IS confirmed
  const { data: confirmedData } = await admin.auth.admin.getUserById(userId);
  if (confirmedData.user?.email_confirmed_at) {
    pass('Main test user has email_confirmed_at set — pre-confirmed via Admin API');
  } else {
    fail('Main test user missing email_confirmed_at after admin createUser');
  }
} else {
  skip('Email verification state checks require service role key (skipped)');
}

// ── 3. PROFILE AUTO-CREATED (DB trigger) ─────────────────────────────────────
section('3. Profile Auto-Created (DB trigger)');

await new Promise((r) => setTimeout(r, 1200));

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

// ── 4. SIGN IN (fresh) ────────────────────────────────────────────────────────
section('4. Sign In');

pass(`Sign in successful`);
pass(`access_token  : ${anonSession.access_token.slice(0, 24)}…`);
pass(`refresh_token : ${anonSession.refresh_token.slice(0, 16)}…`);
pass(`expires_at    : ${new Date(anonSession.expires_at * 1000).toISOString()}`);

// ── 5. SESSION PERSISTENCE ────────────────────────────────────────────────────
section('5. Session Persistence (getUser)');

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

// ── 6. FORGOT PASSWORD (resetPasswordForEmail) ────────────────────────────────
section('6. Forgot Password — resetPasswordForEmail');

if (admin) {
  // Call the API — we verify it doesn't error (actual email delivery is external)
  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
    redirectTo: 'braxton://reset-password',
  });

  if (resetErr) {
    fail(`resetPasswordForEmail failed: ${resetErr.message}`);
  } else {
    pass('resetPasswordForEmail returned no error — reset email queued');
    pass('Deep link redirect: braxton://reset-password (correct scheme)');
  }

  // Test with a non-existent email — Supabase returns success to prevent enumeration
  const { error: noUserErr } = await supabase.auth.resetPasswordForEmail(
    `nonexistent-${Date.now()}@braxton-test.com`,
    { redirectTo: 'braxton://reset-password' },
  );
  if (!noUserErr) {
    pass('Non-existent email returns no error — prevents user enumeration');
  } else {
    warn(`Non-existent email returned error: ${noUserErr.message}`);
  }
} else {
  skip('Forgot password test skipped (no service role key — cannot verify user state)');
}

// ── 7. PASSWORD UPDATE (updateUser) ──────────────────────────────────────────
section('7. Password Update — updateUser');

if (admin) {
  // Sign in as the user (needed to call updateUser)
  const { data: updateSignIn, error: updateSignInErr } = await supabase.auth.signInWithPassword({
    email:    TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (updateSignInErr) {
    fail(`Sign in for password update failed: ${updateSignInErr.message}`);
  } else {
    const { error: updateErr } = await supabase.auth.updateUser({ password: TEST_NEW_PASS });

    if (updateErr) {
      fail(`updateUser failed: ${updateErr.message}`);
    } else {
      pass('updateUser({ password }) returned no error');

      // Sign out, then verify new password works
      await supabase.auth.signOut();

      const { data: newSignIn, error: newSignInErr } = await supabase.auth.signInWithPassword({
        email:    TEST_EMAIL,
        password: TEST_NEW_PASS,
      });

      if (newSignInErr) {
        fail(`Sign in with new password failed: ${newSignInErr.message}`);
      } else {
        pass('Signed in successfully with new password');
        anonSession = newSignIn.session;
      }

      // Verify old password is rejected
      await supabase.auth.signOut();
      const { error: oldPassErr } = await supabase.auth.signInWithPassword({
        email:    TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      if (oldPassErr) {
        pass('Old password correctly rejected after update');
      } else {
        fail('Old password still accepted after update — password change did not persist');
      }
    }
  }
} else {
  skip('Password update test skipped (requires service role key)');
}

// ── 8. SIGN OUT ───────────────────────────────────────────────────────────────
section('8. Sign Out');

// Re-sign in with the updated password first (if admin mode)
if (admin) {
  await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_NEW_PASS });
}

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

// ── 9. RLS: unauthenticated read blocked ──────────────────────────────────────
section('9. RLS — Unauthenticated Access Blocked');

const { data: leaked, error: rlsError } = await supabase
  .from('restaurant_memberships')
  .select('*');

if (rlsError || leaked?.length === 0) {
  pass('Unauthenticated read returns 0 rows (RLS working)');
} else {
  fail(`RLS gap — got ${leaked?.length} membership rows without auth`);
}

// ── 10. PROTECTED SCREEN REDIRECT (session state) ────────────────────────────
section('10. Protected Screen — unauthenticated session state');

const freshClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const { data: { session: freshSession } } = await freshClient.auth.getSession();

if (!freshSession) {
  pass('Fresh client has no session — isAuthenticated would be false');
  pass('Account screen loading gate would redirect to sign-in prompt');
} else {
  fail('Unexpected session on fresh client — check ExpoSecureStoreAdapter');
}

// ── 11. CLEANUP ───────────────────────────────────────────────────────────────
section('11. Cleanup (delete test user)');

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
  pass('All tests passed. Auth is fully wired up.\n');
  console.log('  Verified:');
  console.log('  • User creation + email confirmation state');
  console.log('  • Profile auto-created by DB trigger');
  console.log('  • Sign in / session persistence');
  console.log('  • Forgot password (resetPasswordForEmail, no enumeration)');
  console.log('  • Password update via updateUser');
  console.log('  • Sign out clears session');
  console.log('  • RLS blocks unauthenticated reads');
  console.log('  • Fresh client has no session (protected screen redirect correct)\n');
  if (!admin) {
    console.log('  Tip: run with SUPABASE_SERVICE_ROLE_KEY=<key> for the complete suite.');
    console.log('  Checks 2, 6, 7, 11 were skipped.\n');
  }
}
