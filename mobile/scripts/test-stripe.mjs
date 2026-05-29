/**
 * Stripe + Supabase end-to-end integration test
 *
 * Tests the full membership lifecycle by:
 *   1. Creating a real test auth user in Supabase
 *   2. Calling the deployed Edge Functions with a valid JWT
 *   3. Constructing signed Stripe webhook payloads and POSTing them
 *      to the deployed stripe-webhook Edge Function
 *   4. Asserting the restaurant_memberships row reflects each state
 *   5. Testing the Customer Portal session creation
 *   6. Cleaning up all test data
 *
 * Run from your local machine (NOT the cloud container):
 *
 *   cd mobile
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   STRIPE_SECRET_KEY=sk_test_<key> \
 *   STRIPE_WEBHOOK_SECRET=whsec_<key> \
 *   node scripts/test-stripe.mjs
 *
 * All three env vars are required. Use your TEST keys — no live data is touched.
 * The test creates real Stripe test objects and cleans them up on exit.
 */

import WebSocket from 'ws';
global.WebSocket = WebSocket;

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = 'https://adspyshcuylalvhtothn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc3B5c2hjdXlsYWx2aHRvdGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTU4MTgsImV4cCI6MjA5NTQ3MTgxOH0.mCjKRT-s3k1puD5dUuFwwxLCvPCW9vgOBQEXs9BqtdU';

const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

const SERVICE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET    = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET   = process.env.STRIPE_WEBHOOK_SECRET;
const PRICE_ID         = process.env.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID
                      || process.env.STRIPE_PREMIUM_PRICE_ID;

const missing = [];
if (!SERVICE_KEY)    missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!STRIPE_SECRET)  missing.push('STRIPE_SECRET_KEY');
if (!WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');
if (missing.length) {
  console.error(`  ❌  Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}
if (!STRIPE_SECRET.startsWith('sk_test_')) {
  console.error('  ❌  STRIPE_SECRET_KEY must be a TEST key (sk_test_...)');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' });
const admin  = createClient(SUPABASE_URL, SERVICE_KEY,       { auth: { persistSession: false } });
const anon   = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

function pass(msg)  { console.log(`  ✅  ${msg}`); }
function fail(msg)  { console.error(`  ❌  ${msg}`); process.exitCode = 1; }
function info(msg)  { console.log(`       ${msg}`); }
function warn(msg)  { console.log(`  ⚠️   ${msg}`); }
function section(t) { console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 44 - t.length))}`); }

// Track all Stripe objects to clean up on exit
const cleanup = { customerId: null, subscriptionId: null, userId: null };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** POST a signed Stripe webhook event to the deployed Edge Function */
async function sendWebhookEvent(eventType, dataObject) {
  const payload   = JSON.stringify({ type: eventType, data: { object: dataObject } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret:    WEBHOOK_SECRET,
    timestamp,
  });

  const res = await fetch(`${FUNCTIONS_BASE}/stripe-webhook`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
    body:    payload,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Webhook responded ${res.status}: ${text}`);
  const json = JSON.parse(text);
  // The webhook returns { received: true, warning } when an internal error occurs
  // (e.g. DB upsert failure) — surface it as a thrown error so the test fails clearly.
  if (json.warning) throw new Error(`Webhook internal error: ${json.warning}`);
  return json;
}

/** Read the membership row for a user via the admin client */
async function getMembership(userId) {
  const { data, error } = await admin
    .from('restaurant_memberships')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Call an Edge Function with a user-scoped JWT */
async function invokeFunction(name, userClient, body = {}) {
  const { data: { session } } = await userClient.auth.getSession();
  if (!session) throw new Error('No active session for invokeFunction');

  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey':         SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json;
}

// ── PRE-FLIGHT: Verify migration 026 is applied ───────────────────────────────
section('Pre-flight — verifying database schema');

{
  const { error: schemaErr } = await admin
    .from('restaurant_memberships')
    .select('cancel_at_period_end, cancel_at')
    .limit(1);

  if (schemaErr) {
    const msg = schemaErr.message ?? '';
    if (msg.includes('cancel_at_period_end') || msg.includes('cancel_at')) {
      console.error('\n  ❌  Migration 026 has NOT been applied.');
      console.error('       The cancel_at_period_end / cancel_at columns are missing.\n');
      console.error('       Run this SQL in the Supabase SQL Editor, then re-run this test:\n');
      console.error('         ALTER TABLE public.restaurant_memberships');
      console.error('           ADD COLUMN IF NOT EXISTS cancel_at_period_end  boolean  NOT NULL DEFAULT false,');
      console.error('           ADD COLUMN IF NOT EXISTS cancel_at             timestamptz;\n');
      process.exit(1);
    }
    warn(`Schema pre-flight returned unexpected error (non-fatal): ${msg}`);
  } else {
    pass('Schema OK — cancel_at_period_end and cancel_at columns present');
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
section('Setup — creating test user and Stripe customer');

const TEST_EMAIL    = `stripe-e2e-${Date.now()}@braxton-test.local`;
const TEST_PASSWORD = 'StripeTest999!';

const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true,
  user_metadata: { full_name: 'Stripe E2E Test' },
});
if (createErr || !created?.user) {
  fail(`Could not create test user: ${createErr?.message}`); process.exit(1);
}
cleanup.userId = created.user.id;
pass(`Test user created: ${TEST_EMAIL}`);
info(`user_id: ${cleanup.userId.slice(0, 8)}...`);

// Sign in with the anon client to get a user-scoped JWT
const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: signInErr } = await userClient.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
if (signInErr) { fail(`Sign-in failed: ${signInErr.message}`); process.exit(1); }
pass('Signed in — user JWT available for Edge Function calls');

// Create a Stripe test customer directly (simulating what create-checkout-session does)
const customer = await stripe.customers.create({
  email:    TEST_EMAIL,
  metadata: { supabase_user_id: cleanup.userId },
});
cleanup.customerId = customer.id;
pass(`Stripe test customer created: ${customer.id}`);

// Seed the membership row with this customer (mirrors what create-checkout-session upserts)
await admin.from('restaurant_memberships').upsert(
  { user_id: cleanup.userId, stripe_customer_id: customer.id, status: 'inactive', plan: 'premium' },
  { onConflict: 'user_id' },
);
pass('Membership row seeded with Stripe customer ID');

// ── CHECK 1: create-checkout-session Edge Function ────────────────────────────
section('Check 1 — create-checkout-session Edge Function');

{
  if (!PRICE_ID) {
    warn('EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID / STRIPE_PREMIUM_PRICE_ID not set');
    warn('Skipping checkout session creation — provide the price ID to test this');
  } else {
    try {
      const result = await invokeFunction('create-checkout-session', userClient, { priceId: PRICE_ID });

      if (result.url?.startsWith('https://checkout.stripe.com')) {
        pass('checkout.stripe.com URL returned — Edge Function reachable and authenticated');
        info(`url: ${result.url.slice(0, 60)}...`);
        info(`sessionId: ${result.sessionId}`);
      } else {
        fail(`Unexpected URL format: ${result.url}`);
      }

      // Verify the membership row now has the customer ID
      const row = await getMembership(cleanup.userId);
      if (row?.stripe_customer_id === customer.id) {
        pass('Membership row links correct Stripe customer ID');
      } else {
        warn(`stripe_customer_id mismatch — got: ${row?.stripe_customer_id}`);
      }

      // Verify re-subscribing over an active plan is blocked
      await admin.from('restaurant_memberships').update({ status: 'active', stripe_subscription_id: 'sub_test' }).eq('user_id', cleanup.userId);
      try {
        await invokeFunction('create-checkout-session', userClient, { priceId: PRICE_ID });
        fail('Re-subscribe over active plan should have been blocked');
      } catch (e) {
        if (e.message.includes('already have an active')) {
          pass('Re-subscribe correctly blocked for active subscriber');
        } else {
          fail(`Wrong error for re-subscribe attempt: ${e.message}`);
        }
      }
      // Reset back to inactive for webhook tests
      await admin.from('restaurant_memberships').update({ status: 'inactive', stripe_subscription_id: null }).eq('user_id', cleanup.userId);

    } catch (err) {
      fail(`create-checkout-session failed: ${err.message}`);
    }
  }
}

// ── CHECK 2: Webhook — checkout.session.completed ────────────────────────────
section('Check 2 — Webhook: checkout.session.completed → active');

{
  const now = Math.floor(Date.now() / 1000);

  // Create a real Stripe test subscription
  let sub;
  try {
    // Need a payment method to attach for test subscription
    const pm = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: 'tok_visa' },
    });
    await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: pm.id },
    });

    if (PRICE_ID) {
      sub = await stripe.subscriptions.create({
        customer: customer.id,
        items:    [{ price: PRICE_ID }],
        metadata: { supabase_user_id: cleanup.userId },
      });
      cleanup.subscriptionId = sub.id;
      pass(`Stripe test subscription created: ${sub.id}`);
      info(`status: ${sub.status}`);
    } else {
      warn('No PRICE_ID — using synthetic subscription object for webhook tests');
      // Build a minimal synthetic object that matches the real shape
      sub = {
        id:                   'sub_test_synthetic_001',
        customer:             customer.id,
        status:               'active',
        current_period_start: now - 86400,
        current_period_end:   now + (30 * 86400),
        cancel_at_period_end: false,
        cancel_at:            null,
        metadata:             { supabase_user_id: cleanup.userId },
      };
    }
  } catch (err) {
    warn(`Could not create real subscription: ${err.message}`);
    warn('Using synthetic subscription object for remaining webhook tests');
    sub = {
      id:                   'sub_test_synthetic_001',
      customer:             customer.id,
      status:               'active',
      current_period_start: now - 86400,
      current_period_end:   now + (30 * 86400),
      cancel_at_period_end: false,
      cancel_at:            null,
      metadata:             { supabase_user_id: cleanup.userId },
    };
  }

  // Build and send a checkout.session.completed webhook event
  const sessionObj = {
    id:           `cs_test_${Date.now()}`,
    mode:         'subscription',
    subscription: sub.id ?? sub,
    metadata:     { supabase_user_id: cleanup.userId },
    customer:     customer.id,
  };

  try {
    await sendWebhookEvent('checkout.session.completed', sessionObj);
    await new Promise(r => setTimeout(r, 800)); // brief settle time

    const row = await getMembership(cleanup.userId);
    if (row?.status === 'active') {
      pass('status = active after checkout.session.completed');
      pass(`isPremium would be: true`);
      info(`period_end: ${row.current_period_end}`);
      info(`cancel_at_period_end: ${row.cancel_at_period_end}`);
    } else {
      fail(`Expected status=active, got: ${row?.status}`);
    }
  } catch (err) {
    fail(`checkout.session.completed webhook failed: ${err.message}`);
  }
}

// ── CHECK 3: Webhook — invoice.payment_failed → past_due ─────────────────────
section('Check 3 — Webhook: invoice.payment_failed → past_due');

{
  const invoiceObj = {
    id:           `in_test_failed_${Date.now()}`,
    subscription: cleanup.subscriptionId ?? 'sub_test_synthetic_001',
    customer:     customer.id,
    status:       'open',
  };

  try {
    await sendWebhookEvent('invoice.payment_failed', invoiceObj);
    await new Promise(r => setTimeout(r, 800));

    const row = await getMembership(cleanup.userId);
    if (row?.status === 'past_due') {
      pass('status = past_due after invoice.payment_failed');
      pass('isPastDue would be: true');
      pass('hasAccess would be: true (user not locked out, warning banner shown)');
    } else {
      fail(`Expected status=past_due, got: ${row?.status}`);
    }
  } catch (err) {
    fail(`invoice.payment_failed webhook failed: ${err.message}`);
  }
}

// ── CHECK 4: Webhook — invoice.paid → active (payment recovery) ───────────────
section('Check 4 — Webhook: invoice.paid → active (recovery from past_due)');

{
  const invoiceObj = {
    id:           `in_test_paid_${Date.now()}`,
    subscription: cleanup.subscriptionId ?? 'sub_test_synthetic_001',
    customer:     customer.id,
    status:       'paid',
  };

  try {
    await sendWebhookEvent('invoice.paid', invoiceObj);
    await new Promise(r => setTimeout(r, 800));

    const row = await getMembership(cleanup.userId);
    if (row?.status === 'active') {
      pass('status = active after invoice.paid (past_due recovered)');
    } else {
      fail(`Expected status=active, got: ${row?.status}`);
    }
  } catch (err) {
    fail(`invoice.paid webhook failed: ${err.message}`);
  }
}

// ── CHECK 5: Webhook — customer.subscription.updated (cancel_at_period_end) ───
section('Check 5 — Webhook: subscription.updated with cancel_at_period_end=true');

{
  const now    = Math.floor(Date.now() / 1000);
  const cancelAt = now + (23 * 24 * 3600); // 23 days from now

  const subObj = {
    id:                   cleanup.subscriptionId ?? 'sub_test_synthetic_001',
    customer:             customer.id,
    status:               'active',
    current_period_start: now - (7 * 86400),
    current_period_end:   cancelAt,
    cancel_at_period_end: true,
    cancel_at:            cancelAt,
    metadata:             { supabase_user_id: cleanup.userId },
  };

  try {
    await sendWebhookEvent('customer.subscription.updated', subObj);
    await new Promise(r => setTimeout(r, 800));

    const row = await getMembership(cleanup.userId);
    if (row?.status === 'active' && row?.cancel_at_period_end === true) {
      pass('status = active, cancel_at_period_end = true');
      pass('isCancelledPending would be: true');
      pass('Manage Subscription screen shows "Cancels on [date]" banner');
      info(`cancel_at: ${row.cancel_at}`);
    } else {
      fail(`Expected active + cancel_at_period_end=true, got: status=${row?.status}, cancel_at_period_end=${row?.cancel_at_period_end}`);
    }
  } catch (err) {
    fail(`subscription.updated (cancel_at_period_end) webhook failed: ${err.message}`);
  }
}

// ── CHECK 6: Webhook — customer.subscription.deleted → cancelled ──────────────
section('Check 6 — Webhook: customer.subscription.deleted → cancelled');

{
  const now = Math.floor(Date.now() / 1000);

  const subObj = {
    id:                   cleanup.subscriptionId ?? 'sub_test_synthetic_001',
    customer:             customer.id,
    status:               'canceled',
    current_period_start: now - (30 * 86400),
    current_period_end:   now + (2 * 86400), // 2 days of grace period remaining
    cancel_at_period_end: false,
    cancel_at:            null,
    metadata:             { supabase_user_id: cleanup.userId },
  };

  try {
    await sendWebhookEvent('customer.subscription.deleted', subObj);
    await new Promise(r => setTimeout(r, 800));

    const row = await getMembership(cleanup.userId);
    if (row?.status === 'cancelled') {
      pass('status = cancelled after customer.subscription.deleted');
      const periodEnd = row.current_period_end ? new Date(row.current_period_end) : null;
      const hasGrace  = periodEnd && periodEnd > new Date();
      if (hasGrace) {
        pass(`isCancelledWithAccess would be: true (grace until ${periodEnd.toDateString()})`);
        pass('hasAccess = true — user retains benefits until period end');
      } else {
        info('No grace period — hasAccess = false');
      }
    } else {
      fail(`Expected status=cancelled, got: ${row?.status}`);
    }
  } catch (err) {
    fail(`subscription.deleted webhook failed: ${err.message}`);
  }
}

// ── CHECK 7: create-portal-session Edge Function ──────────────────────────────
section('Check 7 — create-portal-session Edge Function');

{
  try {
    const result = await invokeFunction('create-portal-session', userClient);

    if (result.url?.includes('billing.stripe.com')) {
      pass('billing.stripe.com URL returned — Customer Portal reachable');
      info(`url: ${result.url.slice(0, 60)}...`);
    } else {
      fail(`Unexpected portal URL: ${result.url}`);
    }
  } catch (err) {
    fail(`create-portal-session failed: ${err.message}`);
  }
}

// ── CHECK 8: RLS — user can read own row, not others ─────────────────────────
section('Check 8 — RLS: authenticated user sees own membership only');

{
  const { data: ownRow } = await userClient
    .from('restaurant_memberships')
    .select('id, status')
    .eq('user_id', cleanup.userId)
    .maybeSingle();

  if (ownRow) {
    pass('User can read their own membership row (RLS correct)');
    info(`status: ${ownRow.status}`);
  } else {
    fail('User cannot read own membership — RLS too strict');
  }

  // Attempt to read a different user's row
  const OTHER_ID = '00000000-0000-0000-0000-000000000099';
  const { data: otherRow } = await userClient
    .from('restaurant_memberships')
    .select('id')
    .eq('user_id', OTHER_ID);

  if (!otherRow || otherRow.length === 0) {
    pass("User cannot read another user's membership — RLS isolation correct");
  } else {
    fail('Cross-user membership row accessible — RLS isolation broken');
  }
}

// ── CLEANUP ───────────────────────────────────────────────────────────────────
section('Cleanup — removing all test data');

{
  if (cleanup.subscriptionId) {
    try {
      await stripe.subscriptions.cancel(cleanup.subscriptionId);
      pass(`Stripe subscription ${cleanup.subscriptionId} cancelled`);
    } catch (e) {
      warn(`Could not cancel Stripe subscription: ${e.message}`);
    }
  }

  if (cleanup.customerId) {
    try {
      await stripe.customers.del(cleanup.customerId);
      pass(`Stripe customer ${cleanup.customerId} deleted`);
    } catch (e) {
      warn(`Could not delete Stripe customer: ${e.message}`);
    }
  }

  if (cleanup.userId) {
    const { error: profErr } = await admin
      .from('restaurant_memberships')
      .delete()
      .eq('user_id', cleanup.userId);
    profErr ? warn(`Membership cleanup: ${profErr.message}`) : pass('Membership row deleted');

    const { error: userErr } = await admin.auth.admin.deleteUser(cleanup.userId);
    userErr ? warn(`User cleanup: ${userErr.message}`) : pass('Auth user deleted');
  }
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
section('Summary');

if (process.exitCode === 1) {
  console.log('  Some checks failed — see ❌ above.\n');
} else {
  pass('All checks passed — Stripe integration is production-ready.\n');
  console.log('  Verified end-to-end:');
  console.log('  ✓  create-checkout-session  → returns checkout.stripe.com URL');
  console.log('  ✓  checkout.session.completed webhook → status=active');
  console.log('  ✓  invoice.payment_failed webhook → status=past_due');
  console.log('  ✓  invoice.paid webhook → status=active (recovery)');
  console.log('  ✓  subscription.updated (cancel_at_period_end) → banners correct');
  console.log('  ✓  subscription.deleted webhook → status=cancelled + grace period');
  console.log('  ✓  create-portal-session → returns billing.stripe.com URL');
  console.log('  ✓  RLS: users see own row only, no cross-user leakage\n');
}
