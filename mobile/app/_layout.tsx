import { useEffect } from 'react';
import { Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

function parseHashParams(url: string): Record<string, string> {
  const hash = url.split('#')[1] ?? '';
  return Object.fromEntries(new URLSearchParams(hash));
}

async function handleDeepLink(url: string | null) {
  if (!url) return;

  // ── Password reset (cafelocco://reset-password#access_token=...&type=recovery) ──
  const params = parseHashParams(url);
  if (params.type === 'recovery' && params.access_token && params.refresh_token) {
    await supabase.auth.setSession({
      access_token:  params.access_token,
      refresh_token: params.refresh_token,
    });
    router.replace('/reset-password');
    return;
  }

  // ── Subscription success (cold-start from Stripe redirect) ─────────────────
  // Normal flow: openAuthSessionAsync in membership.tsx handles this inline.
  // This covers the rare case where the app was not running when Stripe redirected.
  if (url.includes('subscription-success')) {
    router.replace('/subscription-success');
    return;
  }

  // ── Subscription cancelled (user closed Stripe Checkout on cold start) ──────
  if (url.includes('subscription-cancel')) {
    router.replace('/subscription-cancel');
    return;
  }
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();

    Linking.getInitialURL().then(handleDeepLink);
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  const nav = (
    <>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="about"                 options={{ presentation: 'card' }} />
        <Stack.Screen name="reservations"          options={{ presentation: 'card' }} />
        <Stack.Screen name="membership"            options={{ presentation: 'modal' }} />
        <Stack.Screen name="coffee-claim"          options={{ presentation: 'modal' }} />
        <Stack.Screen name="contact"               options={{ presentation: 'card' }} />
        <Stack.Screen name="manage-subscription"   options={{ presentation: 'modal' }} />
        <Stack.Screen name="reset-password"        options={{ presentation: 'modal' }} />
        <Stack.Screen name="subscription-success"  options={{ presentation: 'modal' }} />
        <Stack.Screen name="subscription-cancel"   options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-profile"          options={{ presentation: 'card'  }} />
        <Stack.Screen name="my-reservations"       options={{ presentation: 'card'  }} />
      </Stack>
    </>
  );

  // StripeProvider native module crashes if publishableKey is empty string
  if (!STRIPE_PUBLISHABLE_KEY) return nav;

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.cafelocco.app">
      {nav}
    </StripeProvider>
  );
}
