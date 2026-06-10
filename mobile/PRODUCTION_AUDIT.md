# Braxton Mobile — Production Readiness Audit
_Generated: 2026-06-01_

---

## Summary

The app is structurally complete and passes Expo Doctor. Before a real restaurant can
use it, **three categories of work remain**: replacing all placeholder content with real
data, applying one pending database migration, and swapping in live Stripe credentials.
No architectural changes are needed.

---

## 1. Critical — Must Fix Before Launch

### C1 · Stripe credentials are placeholders — subscriptions completely broken

**`.env` lines 6–7**
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_PRICE_ID
```
`membership.tsx:71–73` already guards `!PRICE_ID` (shows alert). But with a placeholder
publishable key the `StripeProvider` in `_layout.tsx:51` initialises incorrectly and
`createCheckoutSession` will return a 500 from the edge function.

**Fix:** Replace with real Stripe keys. See C6 for the edge function side.

---

### C2 · Database migration 026 not applied — webhook silently fails for every subscriber

`supabase/migrations/026_stripe_improvements.sql` adds `cancel_at_period_end` and
`cancel_at` to `restaurant_memberships`. If those columns do not exist in the live
Supabase project, `stripe-webhook/index.ts:61–76` (`syncSubscription`) throws a DB
upsert error on every subscription event. The webhook returns `{ warning }` and Stripe
retries, but membership status **never moves from `inactive` to `active`**.

**Fix (run once in Supabase SQL Editor):**
```sql
ALTER TABLE public.restaurant_memberships
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel_at timestamptz;
```
Then redeploy:
```bash
supabase functions deploy stripe-webhook
```

---

### C3 · Fake restaurant address hardcoded in two screens

**`app/(tabs)/index.tsx:99`**
```tsx
<Text style={styles.addressText}>24 Mayfair Lane, London W1J 7BX</Text>
```
Hardcoded directly — not read from any env var.

**`app/contact.tsx:28`**
```ts
const ADDRESS = process.env.EXPO_PUBLIC_RESTAURANT_ADDRESS ?? '24 Mayfair Lane, London W1J 7BX';
```
`EXPO_PUBLIC_RESTAURANT_ADDRESS` is absent from `.env`, so the fallback fires and the
fake address is shown to every user.

**Fix (two parts):**
1. Add `EXPO_PUBLIC_RESTAURANT_ADDRESS=<real address>` to `.env`
2. In `index.tsx:99`, read `process.env.EXPO_PUBLIC_RESTAURANT_ADDRESS` instead of the
   hardcoded literal. See also C4 for the other home screen hardcodes.

---

### C4 · Placeholder phone/WhatsApp numbers shown to users

**`.env` lines 10–11**
```
EXPO_PUBLIC_RESTAURANT_PHONE=+441234567890
EXPO_PUBLIC_RESTAURANT_WHATSAPP=+441234567890
```
`contact.tsx` reads these and renders them as tappable `tel://` and WhatsApp links.
Any user who taps "Call Us" will ring a random UK mobile number.

**Fix:** Replace with the real restaurant phone number before any user testing.

---

### C5 · Entire About screen contains invented content

`app/about.tsx` hardcodes team members, milestones, a chef quote, and restaurant stats.
None of it is configurable without a code change.

| Line | Fake content |
|------|-------------|
| 17–22 | Team: "James Braxton", "Sophie Laurent", "Marco Rossi" |
| 24–29 | Milestones: 2010 opening, 2013/2016/2019 awards, 2023 membership |
| 70–84 (index.tsx) | Stats: "14+ Years", "3 Awards", "48 Seats" |
| 74–84 (index.tsx) | Story copy: "Since 2010, Braxton has been crafting…" |

**Fix:** Replace with real restaurant copy. The structure is fine — just update the data
constants at the top of each file.

---

### C6 · Stripe edge function environment variables must be set in Supabase

The webhook and checkout functions read server-side env vars (`STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) that must be configured in the
Supabase Dashboard → Functions → Secrets before any real subscription can be processed.

**Required secrets:**
```
STRIPE_SECRET_KEY         = sk_live_…
STRIPE_WEBHOOK_SECRET     = whsec_…
SUPABASE_URL              = (auto-provided by Supabase)
SUPABASE_SERVICE_ROLE_KEY = (auto-provided by Supabase)
```

---

### C7 · Terms of Service and Privacy Policy are inert text — not tappable

**`app/(auth)/signup.tsx:162–167`**
```tsx
<Text style={styles.terms}>
  By signing up, you agree to our{' '}
  <Text style={styles.termsLink}>Terms of Service</Text>
  {' '}and{' '}
  <Text style={styles.termsLink}>Privacy Policy</Text>
</Text>
```
These are `Text` nodes with no `onPress`. Users consent to documents they cannot read.
This fails App Store review guidelines (section 5.1) and is a GDPR issue.

**Fix:** Wrap each in a `TouchableOpacity` that opens the relevant URL:
```tsx
<TouchableOpacity onPress={() => Linking.openURL('https://yourdomain.com/terms')}>
  <Text style={styles.termsLink}>Terms of Service</Text>
</TouchableOpacity>
```
The actual policy pages can be a simple hosted web page; they do not need to be in-app.

---

### C8 · External Unsplash images — fragile in production

Five fallback/hero images point to `images.unsplash.com`:

| File | Line | URL |
|------|------|-----|
| `components/home/HeroSection.tsx` | 25 | `photo-1517248135467-4c7edcad34c4?w=800` |
| `app/about.tsx` | 38 | `photo-1414235077428-338989a2e8c0?w=800` |
| `components/gallery/GalleryGrid.tsx` | 21 | `photo-1414235077428-338989a2e8c0?w=400` |
| `components/menu/MenuItemCard.tsx` | 22 | `photo-1546069901-ba9599a7e63c?w=300` |
| `components/home/FeaturedMenuItem.tsx` | 30 | `photo-1504674900247-0877df9cc836?w=400` |

Unsplash can rate-limit, go offline, or require attribution. In the hero and about screens
these are the **primary** image, not just a fallback.

**Fix:** Replace hero/about images with real restaurant photography in `assets/images/`.
For menu/gallery fallbacks, add a bundled placeholder PNG (`assets/images/placeholder-dish.png`)
and reference it with `require()` instead.

---

## 2. Recommended — Fix Before Submission

### R1 · Opening hours are hardcoded, not configurable

**`app/(tabs)/index.tsx:20–24`**
```ts
const OPENING_HOURS = [
  { day: 'Mon – Thu', hours: '12pm – 10pm' },
  { day: 'Fri – Sat', hours: '12pm – 11pm' },
  { day: 'Sunday',   hours: '11am – 9pm'  },
];
```
If hours change, an app update is required. For launch, at minimum replace with the
real hours. Longer-term, store hours in Supabase.

---

### R2 · No in-session password change

Users can only reset their password via the forgot-password email link.
`useAuth.ts` exposes `updatePassword()` but there is no screen that calls it when the
user is already logged in.

**Fix:** Add a "Change Password" screen accessible from the Account → Edit Profile area,
calling `supabase.auth.updateUser({ password: newPassword })`.

---

### R3 · Reservation date input is a plain text field

`reservations.tsx:248–254` renders a raw `TextInput` with format hint `YYYY-MM-DD`.
Users on Android/iOS expect a native date picker. A mis-typed date passes format
validation but could land a reservation on the wrong day.

**Fix:** Use `@react-native-community/datetimepicker` or render a date grid, replacing
the text field. The validation logic (`isValid`, `isBefore`) is already correct and
requires no changes.

---

### R4 · No resend verification email button

**`app/(auth)/signup.tsx:93`** only shows "Wrong email? Go back" after signup.
If the verification email goes to spam, users are stuck with no way to resend without
re-registering.

**Fix:**
```tsx
<TouchableOpacity onPress={handleResend}>
  <Text>Resend verification email</Text>
</TouchableOpacity>
```
Where `handleResend` calls `supabase.auth.resend({ type: 'signup', email })`.

---

### R5 · EAS Secrets not yet set for production build profile

`eas.json` production profile has no `env` overrides, relying entirely on EAS Secrets.
None are set yet (confirmed by the placeholder values still in `.env`).

**Fix:** Run for each variable:
```bash
cd mobile
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "…"
# repeat for all 12 EXPO_PUBLIC_* variables
```

---

### R6 · EAS project ID still a placeholder

`app.json → extra.eas.projectId` is currently an empty object (placeholder removed).
Until `eas init` is run, production builds will not be associated with the EAS project.

**Fix:** Run `eas init` in `mobile/` once after logging in.

---

### R7 · `merchantIdentifier` is a placeholder

**`app.json:50`**
```json
"merchantIdentifier": "merchant.com.braxton.restaurant"
```
Apple Pay requires this to match a registered Merchant ID in the Apple Developer portal.
If the identifier is wrong, Apple Pay will be silently unavailable on iOS.

**Fix:** Register `merchant.com.braxton.restaurant` (or your preferred identifier) in
the Apple Developer portal and confirm the string matches exactly.

---

### R8 · No network-offline feedback

If the device has no internet connection, all Supabase calls fail with a generic
connection-refused error. Users see raw error strings or the app appears frozen.

**Fix:** Add a `NetInfo` check (from `@react-native-community/netinfo`) at the hook
level and surface "You're offline — please check your connection" before attempting
any fetch.

---

### R9 · Session fetch has no timeout — infinite loading on network stall

**`hooks/useAuth.ts:15`**
```ts
supabase.auth.getSession().then(({ data: { session } }) => { ... })
```
If the network is unresponsive, `getSession()` never resolves. The `loading` state stays
`true` indefinitely and the user sees a blank spinner forever.

**Fix:** Wrap in a `Promise.race` with a 10 s timeout, then set `loading = false` and
show an error state with a retry button.

---

### R10 · Deep link route matching uses substring — loose and fragile

**`app/_layout.tsx:35, 41`**
```ts
if (url.includes('subscription-success')) { ... }
if (url.includes('subscription-cancel'))  { ... }
```
`braxton://subscription-success-callback` or any URL containing those strings would
match. Exact path matching is safer.

**Fix:** Replace with exact path comparison:
```ts
const path = url.split('://')[1]?.split('?')[0]?.split('#')[0] ?? '';
if (path === 'subscription-success') { ... }
if (path === 'subscription-cancel')  { ... }
```

---

### R11 · Menu category tabs show empty categories

**`hooks/useMenu.ts`**
`categories` is derived from all menu items. If every item in a category is toggled
`is_available = false`, the category tab still appears but clicking it shows
"No items in this category". Users see dead tabs.

**Fix:** Derive categories only from items where `is_available = true`:
```ts
const categories = ['all', ...new Set(items.filter(i => i.is_available).map(i => i.category))];
```

---

### R12 · Menu does not subscribe to realtime — stale after staff update

**`hooks/useMenu.ts`** fetches once on mount and never subscribes to Postgres changes.
If staff update a menu item price or toggle availability, users won't see the change
until they pull-to-refresh or navigate away and back.

**Fix:** Add a Supabase realtime channel identical to the one in `useGallery.ts`.

---

## 3. Future Enhancements

| # | Feature | Where |
|---|---------|-------|
| F1 | Gallery upload from mobile | New screen + Supabase Storage |
| F2 | Avatar photo upload | `edit-profile.tsx` + Supabase Storage |
| F3 | Push notifications (reservation confirmed, membership expiring) | Expo Notifications + backend trigger |
| F4 | Reservation cancellation from app | `my-reservations.tsx` + status update |
| F5 | Invoice history in-app | Stripe invoices API in edge function |
| F6 | Social sign-in (Google / Apple) | `supabase.auth.signInWithOAuth` |
| F7 | Admin / staff dashboard | Web app (outside mobile scope) |
| F8 | Configurable opening hours from Supabase | Replace hardcoded `OPENING_HOURS` |
| F9 | Sentry or Crashlytics error monitoring | `@sentry/react-native` |
| F10 | Offline menu cache | AsyncStorage or MMKV |

---

## 4. Confirmed Working ✓

| Area | Status | Notes |
|------|--------|-------|
| Authentication (sign in/up/out) | ✓ | Session persists via SecureStore |
| Email verification flow | ✓ | "Check your email" screen, re-entry on back |
| Password reset (forgot password) | ✓ | Deep link → reset-password screen |
| Reservation form validation | ✓ | All fields, past-date guard, email regex |
| Reservation submission | ✓ | Supabase insert with user_id linkage |
| Menu loading / category filter | ✓ | Loading, error, empty states + retry |
| Gallery loading / lightbox | ✓ | Realtime subscription, image fallback, skeleton |
| Membership state machine | ✓ | active / past_due / cancelled / isCancelledPending |
| Coffee claim (monthly) | ✓ | Premium gate, double-claim prevention, ref code |
| Stripe checkout session | ✓ (needs real keys) | PRICE_ID guard, openAuthSessionAsync |
| Stripe customer portal | ✓ (needs real keys) | Linking.openURL, error handling |
| Subscription success polling | ✓ | 30 s max, graceful timeout |
| Subscription cancel screen | ✓ | Deep link + cold-start handled |
| Edit profile | ✓ | Name + phone, calls updateProfile() |
| My reservations | ✓ | Fetches by user_id, status badges |
| Manage subscription | ✓ | All 4 membership states surfaced |
| Deep linking | ✓ | reset-password, subscription-success, subscription-cancel |
| TypeScript | ✓ | 0 errors |
| Expo Doctor | ✓ | Passes |
| Android build | ✓ | EAS preview build succeeds |

---

## 5. Launch Checklist

### Phase 1 — Content & Configuration (no code changes)
- [ ] **C3/C4** Add real address: `EXPO_PUBLIC_RESTAURANT_ADDRESS=` in `.env`
- [ ] **C4** Set real phone: `EXPO_PUBLIC_RESTAURANT_PHONE=` in `.env`
- [ ] **C4** Set real WhatsApp: `EXPO_PUBLIC_RESTAURANT_WHATSAPP=` in `.env`
- [ ] **C5** Replace team names, milestones, and quote in `app/about.tsx`
- [ ] **C5** Replace stats and story copy in `app/(tabs)/index.tsx`
- [ ] **R1** Update opening hours in `app/(tabs)/index.tsx:20–24`
- [ ] **C3** Fix `index.tsx:99` hardcoded address → read from `process.env`

### Phase 2 — Stripe Setup
- [ ] Create Stripe account and product/price (or use existing test account for staging)
- [ ] **C1** Set real `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`
- [ ] **C1** Set real `EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID` in `.env`
- [ ] **C6** Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Supabase → Functions → Secrets
- [ ] Configure Stripe webhook endpoint: `https://<project>.supabase.co/functions/v1/stripe-webhook`
  - Enable events: `customer.subscription.created`, `.updated`, `.deleted`, `checkout.session.completed`, `invoice.payment_failed`, `invoice.paid`

### Phase 3 — Database
- [ ] **C2** Run migration 026 SQL in Supabase SQL Editor (see exact SQL above)
- [ ] **C2** Run `supabase functions deploy stripe-webhook`
- [ ] Verify webhook by triggering a test checkout and confirming `restaurant_memberships.status` changes

### Phase 4 — Legal
- [ ] **C7** Create Terms of Service page (any hosted URL)
- [ ] **C7** Create Privacy Policy page (required for GDPR and App Store)
- [ ] **C7** Wire both URLs into signup.tsx `TouchableOpacity` links

### Phase 5 — Images
- [ ] **C8** Replace `HeroSection.tsx` Unsplash URL with real restaurant photography
- [ ] **C8** Replace `about.tsx` hero Unsplash URL with real photo
- [ ] **C8** Add `assets/images/placeholder-dish.png` and reference in menu/gallery fallbacks

### Phase 6 — EAS Build Configuration
- [ ] **R6** Run `eas init` in `mobile/` to set real project ID
- [ ] **R5** Run `eas secret:create` for all 12 `EXPO_PUBLIC_*` vars
- [ ] **R7** Register Apple Pay merchant ID in Apple Developer portal
- [ ] Fill `eas.json` submit credentials (iOS: `appleId`, `ascAppId`, `appleTeamId`; Android: service account key)

### Phase 7 — Recommended Fixes (before App Store submission)
- [ ] **R2** Add "Change Password" screen in Account
- [ ] **R3** Replace date text input with a native date picker
- [ ] **R4** Add "Resend verification email" button on signup success screen

### Phase 8 — Final Verification
- [ ] End-to-end test: sign up → verify email → book reservation → subscribe → claim coffee → manage subscription → cancel → portal
- [ ] Test deep links on both iOS and Android (reset-password, subscription-success, subscription-cancel)
- [ ] Test on low-end Android device (verify performance)
- [ ] Test with airplane mode (verify error states)
- [ ] Run `npx expo-doctor` one final time
- [ ] Submit to TestFlight (iOS) or Internal Testing (Google Play) before public release
