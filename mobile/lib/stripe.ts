import { supabase } from './supabase';

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

export const PREMIUM_PRICE_ID =
  process.env.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID ?? '';

export async function createCheckoutSession(priceId: string): Promise<{ url: string } | null> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId },
  });
  if (error) throw error;
  return data;
}

export async function createPortalSession(): Promise<{ url: string } | null> {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {});
  if (error) throw error;
  return data;
}

export async function getPaymentSheetParams(priceId: string): Promise<{
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
} | null> {
  const { data, error } = await supabase.functions.invoke('create-payment-sheet', {
    body: { priceId },
  });
  if (error) throw error;
  return data;
}
