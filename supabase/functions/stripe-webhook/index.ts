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

// Maps Stripe subscription statuses to our DB enum
const STRIPE_STATUS_MAP: Record<string, string> = {
  active:    'active',
  trialing:  'active',
  past_due:  'past_due',
  unpaid:    'past_due',
  canceled:  'cancelled',
  incomplete: 'inactive',
  incomplete_expired: 'inactive',
  paused:    'inactive',
};

// Resolves supabase user_id from stripe_customer_id, falling back to Stripe object metadata
async function resolveUserId(
  customerId: string,
  metadataFallback?: Record<string, string> | Stripe.Metadata | null,
): Promise<string | null> {
  const { data } = await supabase
    .from('restaurant_memberships')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (data?.user_id) return data.user_id;

  // Fallback: metadata on the subscription or session set at creation time
  return metadataFallback?.supabase_user_id ?? null;
}

// Upserts the restaurant_memberships row from a Stripe Subscription object
async function syncSubscription(
  sub: Stripe.Subscription,
  overrideStatus?: string,
) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const userId = await resolveUserId(customerId, sub.metadata);
  if (!userId) {
    console.error(`[webhook] No user found for Stripe customer ${customerId}`);
    return;
  }

  const status = overrideStatus ?? STRIPE_STATUS_MAP[sub.status] ?? 'inactive';

  await supabase.from('restaurant_memberships').upsert(
    {
      user_id:                userId,
      stripe_customer_id:     customerId,
      stripe_subscription_id: sub.id,
      status,
      plan:                   'premium',
      current_period_start:   new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end:     new Date(sub.current_period_end   * 1000).toISOString(),
      cancel_at_period_end:   sub.cancel_at_period_end,
      cancel_at:              sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
      updated_at:             new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', (err as Error).message);
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Subscription created or updated ─────────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }

      // ── Subscription fully deleted (period ended after cancellation) ─────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub, 'cancelled');
        break;
      }

      // ── Checkout session completed ───────────────────────────────────────────
      // Fires immediately after a user completes payment in Stripe Checkout.
      // Retrieve the subscription object so we have full period details.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          // Link customer to user via session metadata if membership row not yet created
          const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
          const metaUserId = session.metadata?.supabase_user_id ?? null;
          if (metaUserId) {
            // Ensure the membership row exists with the customer ID before syncSubscription
            await supabase.from('restaurant_memberships').upsert(
              {
                user_id:            metaUserId,
                stripe_customer_id: customerId,
                status:             'inactive',
                plan:               'premium',
              },
              { onConflict: 'user_id' },
            );
          }
          await syncSubscription(sub, 'active');
        }
        break;
      }

      // ── Payment failed (invoice) ─────────────────────────────────────────────
      // Fires on each failed payment attempt. We set status to past_due so the app
      // shows the warning banner promptly without waiting for subscription.updated.
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );
          await syncSubscription(sub, 'past_due');
        }
        break;
      }

      // ── Payment succeeded (invoice) ──────────────────────────────────────────
      // Fires when a past_due subscription recovers after a successful retry.
      // Also fires for the initial payment — safe to always set active.
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );
          // Only promote to active if subscription isn't cancelled
          if (sub.status !== 'canceled') {
            await syncSubscription(sub, 'active');
          }
        }
        break;
      }

      default:
        // Unhandled event — not an error, just ignore
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error processing ${event.type}:`, (err as Error).message);
    // Return 200 so Stripe doesn't retry — the error is internal, not a bad request
    return new Response(
      JSON.stringify({ received: true, warning: (err as Error).message }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
