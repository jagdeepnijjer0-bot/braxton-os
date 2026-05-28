import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { priceId } = await req.json();
    if (!priceId) throw new Error('priceId is required');

    // Fetch existing membership row (may not exist yet)
    const { data: membership } = await supabase
      .from('restaurant_memberships')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    // Block re-subscribing over an active subscription
    if (membership?.status === 'active' && membership?.stripe_subscription_id) {
      throw new Error('You already have an active subscription. Manage it from the portal.');
    }

    let customerId = membership?.stripe_customer_id ?? null;

    if (!customerId) {
      // Create a new Stripe customer linked to this Supabase user
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Upsert the membership row with the new customer ID
      await supabase.from('restaurant_memberships').upsert(
        {
          user_id:            user.id,
          stripe_customer_id: customerId,
          status:             'inactive',
          plan:               'premium',
        },
        { onConflict: 'user_id' },
      );
    }

    // Create the Checkout Session
    // success_url uses {CHECKOUT_SESSION_ID} — Stripe replaces this at redirect time
    const session = await stripe.checkout.sessions.create({
      customer:              customerId,
      payment_method_types:  ['card'],
      line_items:            [{ price: priceId, quantity: 1 }],
      mode:                  'subscription',
      allow_promotion_codes: true,
      success_url:           'braxton://subscription-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:            'braxton://subscription-cancel',
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      metadata: { supabase_user_id: user.id },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
