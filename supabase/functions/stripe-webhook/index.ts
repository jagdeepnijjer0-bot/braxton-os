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

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret);
  } catch (err) {
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 });
  }

  async function upsertMembership(
    customerId: string,
    subscriptionId: string,
    status: string,
    periodStart: number | null,
    periodEnd: number | null,
  ) {
    const { data: membership } = await supabase
      .from('restaurant_memberships')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!membership?.user_id) return;

    await supabase.from('restaurant_memberships').upsert({
      user_id: membership.user_id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const statusMap: Record<string, string> = {
        active: 'active',
        past_due: 'past_due',
        canceled: 'cancelled',
        unpaid: 'past_due',
        trialing: 'active',
      };
      await upsertMembership(
        sub.customer as string,
        sub.id,
        statusMap[sub.status] ?? 'inactive',
        sub.current_period_start,
        sub.current_period_end,
      );
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertMembership(sub.customer as string, sub.id, 'cancelled', null, null);
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession;
      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertMembership(
          sub.customer as string,
          sub.id,
          'active',
          sub.current_period_start,
          sub.current_period_end,
        );
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
