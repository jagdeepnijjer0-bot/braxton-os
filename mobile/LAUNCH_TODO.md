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

### BLOCKING — EAS build will fail without these

- [x] **Add app icon and splash images** — generated in `assets/images/`:
  - `assets/images/icon.png` — 1024×1024 px
  - `assets/images/splash.png` — 1284×2778 px (background `#0A0A0A`)
  - `assets/images/adaptive-icon.png` — 1024×1024 px
  - `assets/images/favicon.png` — 64×64 px

- [ ] **Set EAS project ID** — run `eas init` in the `mobile/` directory.
  `app.json → extra.eas.projectId` is currently empty and will be auto-populated.

### Before App Store / Play Store submission

- [ ] Fill in `eas.json` submit credentials:
  - iOS: `appleId`, `ascAppId`, `appleTeamId`
  - Android: `serviceAccountKeyPath` (download from Google Play Console)
- [ ] Set `merchantIdentifier` in `app.json` (currently `merchant.com.braxton.restaurant`)
  to the real Apple Pay merchant ID registered in the Apple Developer portal
- [ ] Verify all `EXPO_PUBLIC_*` env vars are set in EAS Secrets for the `production` profile:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID`
  - `EXPO_PUBLIC_MEMBERSHIP_PRICE_DISPLAY`
  - `EXPO_PUBLIC_RESTAURANT_EMAIL`, `_PHONE`, `_WHATSAPP`, `_ADDRESS`
  - `EXPO_PUBLIC_RESTAURANT_INSTAGRAM`, `_TIKTOK`, `_FACEBOOK`
- [ ] Update real restaurant contact info in `.env` (phone, WhatsApp, address, social URLs)
- [ ] Enable Apple Pay / Google Pay in Stripe Dashboard for the production account
