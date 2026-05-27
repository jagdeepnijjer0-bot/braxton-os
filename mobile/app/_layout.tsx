import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe';
import { Colors } from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.braxton.restaurant">
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="about" options={{ presentation: 'card' }} />
        <Stack.Screen name="reservations" options={{ presentation: 'card' }} />
        <Stack.Screen name="membership" options={{ presentation: 'modal' }} />
        <Stack.Screen name="coffee-claim" options={{ presentation: 'modal' }} />
        <Stack.Screen name="contact" options={{ presentation: 'card' }} />
        <Stack.Screen name="manage-subscription" options={{ presentation: 'modal' }} />
      </Stack>
    </StripeProvider>
  );
}
