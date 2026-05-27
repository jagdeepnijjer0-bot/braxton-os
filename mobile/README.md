# Braxton Restaurant App

Premium restaurant mobile app built with Expo React Native, Supabase, and Stripe.

## Setup

### 1. Install dependencies
```bash
cd mobile
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required variables:
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID` — Stripe Price ID for Premium plan

### 3. Supabase Database
Run the migration in Supabase SQL Editor:
```
supabase/migrations/023_restaurant_schema.sql
```

### 4. Supabase Storage Buckets
Create these buckets in **Supabase Dashboard → Storage** (set to public):
- `gallery`
- `menu-images`
- `restaurant-assets`

### 5. Supabase Edge Functions
Deploy the Stripe edge functions:
```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

Set edge function secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=braxton://
```

### 6. Stripe Setup
1. Create a Product and Price (£24/month) in the Stripe Dashboard
2. Copy the Price ID to `EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID`
3. Set up a webhook endpoint pointing to your `stripe-webhook` edge function
4. Enable webhook events: `customer.subscription.created/updated/deleted`, `checkout.session.completed`

### 7. EAS Build Setup
```bash
npm install -g eas-cli
eas login
eas build:configure
```

Update `eas.json` with your EAS project ID and update `app.json` `extra.eas.projectId`.

## Development
```bash
npx expo start
```

## Build
```bash
# Development build
eas build --platform ios --profile development

# Production build
eas build --platform all --profile production
```

## Screens

| Screen | Route |
|--------|-------|
| Home | `/(tabs)/` |
| Menu | `/(tabs)/menu` |
| Gallery | `/(tabs)/gallery` |
| Account | `/(tabs)/account` |
| Our Story | `/about` |
| Reservations | `/reservations` |
| Membership | `/membership` |
| Claim Coffee | `/coffee-claim` |
| Contact | `/contact` |
| Manage Subscription | `/manage-subscription` |
| Login | `/(auth)/login` |
| Sign Up | `/(auth)/signup` |

## Architecture

```
Expo Router (file-based navigation)
├── Tab Navigator (Home, Menu, Gallery, Account)
├── Stack screens (About, Reservations, Contact, etc.)
└── Auth stack (Login, Signup)

Supabase
├── Auth (email/password)
├── Database (PostgreSQL with RLS)
└── Edge Functions (Stripe integration)

Stripe
├── Checkout Sessions (subscription signup)
├── Customer Portal (manage/cancel)
└── Webhooks (sync subscription state)
```
