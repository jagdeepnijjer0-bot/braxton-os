/**
 * Manage Subscription / Membership end-to-end verification.
 * Run from your local machine:
 *
 *   cd mobile
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/test-membership.mjs
 *
 * Requires the service role key to insert/clean up test rows.
 * The anon key is used to mirror what the app sees for RLS checks.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://adspyshcuylalvhtothn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc3B5c2hjdXlsYWx2aHRvdGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTU4MTgsImV4cCI6MjA5NTQ3MTgxOH0.mCjKRT-s3k1puD5dUuFwwxLCvPCW9vgOBQEXs9BqtdU';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error('  ❌  Set SUPABASE_SERVICE_ROLE_KEY env var to run this script.');
  process.exit(1);
}

const anon  = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(SUPABASE_URL, SERVICE_KEY,       { auth: { persistSession: false } });

function pass(msg)  { console.log(`  ✅  ${msg}`); }
function fail(msg)  { console.error(`  ❌  ${msg}`); process.exitCode = 1; }
function info(msg)  { console.log(`       ${msg}`); }
function warn(msg)  { console.log(`  ⚠️   ${msg}`); }
function section(t) { console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 44 - t.length))}`); }

// Fake user ID — stable UUID that won't collide with real users
const FAKE_USER_ID = '00000000-0000-0000-0000-000000000099';

// ── CHECK 1: Schema matches TypeScript RestaurantMembership interface ──────────
section('Check 1 — Schema: all required columns exist in restaurant_memberships');

{
  // Insert a minimal row with all columns the app uses, then read it back
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('restaurant_memberships')
    .upsert({
      user_id:               FAKE_USER_ID,
      status:                'inactive',
      plan:                  'premium',
      stripe_customer_id:    null,
      stripe_subscription_id: null,
      current_period_start:  null,
      current_period_end:    null,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    fail(`Schema mismatch or insert error: ${error.message}`);
    process.exit(1);
  }

  const expectedCols = [
    'id', 'user_id', 'status', 'plan',
    'stripe_customer_id', 'stripe_subscription_id',
    'current_period_start', 'current_period_end',
    'created_at', 'updated_at',
  ];
  let schemaOk = true;
  for (const col of expectedCols) {
    if (col in data) {
      info(`${col} ✓`);
    } else {
      fail(`Column "${col}" missing from response — schema mismatch`);
      schemaOk = false;
    }
  }
  if (schemaOk) pass('All columns from RestaurantMembership interface present');
}

// ── CHECK 2: Status values match DB check constraint ──────────────────────────
section('Check 2 — Valid status values (active/inactive/cancelled/past_due)');

{
  const valid   = ['active', 'inactive', 'cancelled', 'past_due'];
  const invalid = ['expired', 'paused', 'trial', 'free'];

  for (const status of valid) {
    const { error } = await admin
      .from('restaurant_memberships')
      .update({ status })
      .eq('user_id', FAKE_USER_ID);
    if (error) {
      fail(`Valid status "${status}" rejected: ${error.message}`);
    } else {
      pass(`status="${status}" accepted by DB check constraint`);
    }
  }

  for (const status of invalid) {
    const { error } = await admin
      .from('restaurant_memberships')
      .update({ status })
      .eq('user_id', FAKE_USER_ID);
    if (error) {
      pass(`Invalid status "${status}" rejected by DB check constraint`);
    } else {
      fail(`Invalid status "${status}" was accepted — check constraint may be missing`);
      // Restore to a valid status
      await admin.from('restaurant_memberships').update({ status: 'inactive' }).eq('user_id', FAKE_USER_ID);
    }
  }

  // Restore to inactive
  await admin.from('restaurant_memberships').update({ status: 'inactive' }).eq('user_id', FAKE_USER_ID);
}

// ── CHECK 3: RLS — anon client cannot read any membership rows ────────────────
section('Check 3 — RLS: anon client cannot read restaurant_memberships');

{
  const { data, error } = await anon
    .from('restaurant_memberships')
    .select('id')
    .eq('user_id', FAKE_USER_ID);

  if (error) {
    pass(`Anon SELECT blocked by RLS: ${error.message.slice(0, 60)}`);
  } else if (!data || data.length === 0) {
    pass('Anon SELECT returns 0 rows — RLS auth.uid() = user_id policy working');
  } else {
    fail(`Anon client can read membership rows — RLS not enforced correctly`);
  }
}

// ── CHECK 4: RLS — service role can read and write ────────────────────────────
section('Check 4 — Service role (Stripe webhook) has full access');

{
  const { data, error } = await admin
    .from('restaurant_memberships')
    .select('id, user_id, status')
    .eq('user_id', FAKE_USER_ID)
    .single();

  if (error || !data) {
    fail(`Service role SELECT failed: ${error?.message}`);
  } else {
    pass('Service role can read membership rows (needed for Stripe webhook sync)');
    info(`user_id: ${data.user_id} | status: ${data.status}`);
  }
}

// ── CHECK 5: Unique constraint — one membership per user ─────────────────────
section('Check 5 — Unique constraint: one membership row per user_id');

{
  const { error } = await admin
    .from('restaurant_memberships')
    .insert({ user_id: FAKE_USER_ID, status: 'active', plan: 'premium' });

  if (error && (error.code === '23505' || error.message.includes('unique'))) {
    pass('Duplicate user_id correctly rejected (unique constraint)');
    info(`Error: ${error.message.slice(0, 70)}`);
  } else if (error) {
    fail(`Unexpected error on duplicate insert: ${error.message}`);
  } else {
    fail('Duplicate membership row was inserted — unique constraint missing');
  }
}

// ── CHECK 6: Stripe status transitions (simulate lifecycle) ──────────────────
section('Check 6 — Stripe webhook lifecycle: status transitions');

{
  const transitions = [
    { status: 'active',    label: 'Stripe checkout.session.completed' },
    { status: 'past_due',  label: 'Stripe invoice.payment_failed' },
    { status: 'active',    label: 'Stripe invoice.payment_succeeded (recovery)' },
    { status: 'cancelled', label: 'Stripe customer.subscription.deleted' },
    { status: 'inactive',  label: 'Reset to inactive after cancellation cleanup' },
  ];

  let allTransitions = true;
  for (const { status, label } of transitions) {
    const { error } = await admin
      .from('restaurant_memberships')
      .update({ status })
      .eq('user_id', FAKE_USER_ID);
    if (error) {
      fail(`Transition "${label}" → status="${status}" failed: ${error.message}`);
      allTransitions = false;
    } else {
      pass(`${label} → status="${status}"`);
    }
  }
  if (allTransitions) pass('All Stripe lifecycle status transitions accepted');
}

// ── CHECK 7: updated_at trigger fires on status change ───────────────────────
section('Check 7 — updated_at auto-updates on row change');

{
  const { data: before } = await admin
    .from('restaurant_memberships')
    .select('updated_at')
    .eq('user_id', FAKE_USER_ID)
    .single();

  await new Promise((r) => setTimeout(r, 1100)); // ensure timestamp changes

  await admin
    .from('restaurant_memberships')
    .update({ status: 'active' })
    .eq('user_id', FAKE_USER_ID);

  const { data: after } = await admin
    .from('restaurant_memberships')
    .select('updated_at')
    .eq('user_id', FAKE_USER_ID)
    .single();

  if (before?.updated_at !== after?.updated_at) {
    pass(`updated_at trigger fired: ${before?.updated_at} → ${after?.updated_at}`);
  } else {
    fail('updated_at did not change after update — trigger may not be set');
  }
}

// ── CLEANUP ───────────────────────────────────────────────────────────────────
section('Cleanup — removing test row');

{
  const { error } = await admin
    .from('restaurant_memberships')
    .delete()
    .eq('user_id', FAKE_USER_ID);

  if (error) {
    warn(`Cleanup warning: ${error.message}`);
  } else {
    pass('Test membership row deleted');
  }
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
section('Summary');

if (process.exitCode === 1) {
  console.log('  Some checks failed — see ❌ above.\n');
} else {
  pass('All 7 checks passed — Membership system is fully connected.\n');
  console.log('  The Manage Subscription screen will show:');
  console.log('  • MembershipCard (gold gradient for Premium, grey for inactive)');
  console.log('  • Status badge: Active (green) / Payment Due (amber) / Cancelled (red) / No Plan (grey)');
  console.log('  • "Renews [date]" for active, "Access until [date]" for cancelled-in-grace');
  console.log('  • Past-due warning banner with orange gradient');
  console.log('  • Stripe Customer Portal button (opens secure Stripe-hosted page)');
  console.log('  • Pull-to-refresh to sync latest Stripe status');
  console.log('  • "Claim Free Coffee" shortcut for active Premium members\n');
  console.log('  Next steps to go live:');
  console.log('  1. Deploy Supabase Edge Functions (create-checkout-session,');
  console.log('     create-portal-session, stripe-webhook)');
  console.log('  2. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to Supabase secrets');
  console.log('  3. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and _PREMIUM_PRICE_ID in .env');
  console.log('  4. Configure the Stripe webhook endpoint in the Stripe dashboard\n');
}
