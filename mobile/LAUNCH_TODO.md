# Braxton Mobile — Pre-Launch Checklist

## Stripe Integration Status

### Verified (test account)
- [x] `create-checkout-session` Edge Function — returns `checkout.stripe.com` URL
- [x] `create-portal-session` Edge Function — returns `billing.stripe.com` URL
- [x] Stripe customer + subscription creation via test API
- [x] RLS isolation — users see only their own membership row
- [x] Webhook endpoint reachable and signature verification working

### Known Issue — MUST FIX before production launch
- [ ] **Stripe webhook does not update `restaurant_memberships`**

  `stripe-webhook` receives events and returns `{ received: true }` but the
  membership row stays `inactive` instead of transitioning to `active`,
  `past_due`, `cancelled`, or reflecting `cancel_at_period_end`.

  **Root cause:** Migration `supabase/migrations/026_stripe_improvements.sql`
  has not been applied. The `cancel_at_period_end` and `cancel_at` columns do
  not exist, causing every `syncSubscription()` upsert to fail silently.

  **Fix (two steps):**
  1. Run migration 026 in the Supabase SQL Editor:
     ```sql
     ALTER TABLE public.restaurant_memberships
       ADD COLUMN IF NOT EXISTS cancel_at_period_end  boolean  NOT NULL DEFAULT false,
       ADD COLUMN IF NOT EXISTS cancel_at             timestamptz;
     ```
  2. Redeploy the webhook:
     ```bash
     supabase functions deploy stripe-webhook
     ```
  3. Re-run the E2E test:
     ```bash
     cd mobile && node scripts/test-stripe.mjs
     ```
  The test script will detect the missing migration and print the SQL if step 1
  was skipped.

- [ ] **Switch to final Stripe account and re-test end-to-end**

  All current keys are test-mode keys for the development Stripe account.
  Before going live, swap in the production account's publishable + secret keys,
  create the live product/price, reconfigure the webhook endpoint, and run a
  full test with a real card in Stripe test mode.

---

## Other Pre-Launch Items

- [ ] Replace placeholder values in `app.json`:
  - `extra.eas.projectId` → real EAS project ID (run `eas init`)
  - `extra.supabaseUrl`, `extra.supabaseAnonKey`, `extra.stripePublishableKey`
    are unused (app reads from `EXPO_PUBLIC_*` env vars via `.env`) — can be
    removed to avoid confusion
- [ ] Fill in `eas.json` submit fields:
  - `appleId`, `ascAppId`, `appleTeamId`, `google-service-account.json`
- [ ] Add real app icon and splash screen assets (replace placeholders in `assets/images/`)
- [ ] Set `merchantIdentifier` in `app.json` (currently `merchant.com.braxton.restaurant`)
  to the real Apple Pay merchant ID registered in the Apple Developer portal
- [ ] Verify all `EXPO_PUBLIC_*` env vars are set in EAS build secrets for `production` profile
- [ ] Enable Apple Pay / Google Pay in Stripe Dashboard for the production account
