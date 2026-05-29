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

// Upserts the restaurant_memberships row from a Stripe Subscription object.
// Throws on DB error so the outer handler can return { warning } to Stripe.
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

  const { error } = await supabase.from('restaurant_memberships').upsert(
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
  if (error) throw new Error(`DB upsert failed: ${error.message}`);
}

// Updates only status + updated_at by customer ID.
// Used as fallback when a subscription object cannot be retrieved from Stripe.
async function updateStatusByCustomer(customerId: string, status: string): Promise<void> {
  const userId = await resolveUserId(customerId, null);
  if (!userId) {
    console.error(`[webhook] No user found for Stripe customer ${customerId}`);
    return;
  }
  const { error } = await supabase
    .from('restaurant_memberships')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw new Error(`DB update failed: ${error.message}`);
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
      // Retrieve the subscription so we have full period/status details.
      // If the subscription ID isn't retrievable (e.g. test synthetic ID),
      // fall back to seeding a minimal active row via session metadata.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        if (session.mode === 'subscription' && session.subscription) {
          const subId     = session.subscription as string;
          const custId    = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
          const metaUserId = session.metadata?.supabase_user_id ?? null;

          let sub: Stripe.Subscription | null = null;
          try {
            sub = await stripe.subscriptions.retrieve(subId);
          } catch (retrieveErr) {
            console.warn(`[webhook] checkout.session.completed: subscription ${subId} not retrievable — ${(retrieveErr as Error).message}`);
          }

          if (sub) {
            // Ensure membership row exists and is linked to this customer
            if (metaUserId) {
              const subCustomer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
              await supabase.from('restaurant_memberships').upsert(
                {
                  user_id:            metaUserId,
                  stripe_customer_id: subCustomer,
                  status:             'inactive',
                  plan:               'premium',
                },
                { onConflict: 'user_id' },
              );
            }
            await syncSubscription(sub, 'active');
          } else if (metaUserId && custId) {
            // Fallback: seed minimal active row without full subscription data
            const { error } = await supabase.from('restaurant_memberships').upsert(
              {
                user_id:                metaUserId,
                stripe_customer_id:     custId,
                stripe_subscription_id: subId,
                status:                 'active',
                plan:                   'premium',
                updated_at:             new Date().toISOString(),
              },
              { onConflict: 'user_id' },
            );
            if (error) throw new Error(`DB upsert failed: ${error.message}`);
          }
        }
        break;
      }

      // ── Payment failed (invoice) ─────────────────────────────────────────────
      // Sets status to past_due promptly without waiting for subscription.updated.
      // Falls back to customer-based update if the subscription isn't retrievable.
      case 'invoice.payment_failed': {
        const invoice  = event.data.object as Stripe.Invoice;
        const subId    = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        const custId   = typeof invoice.customer    === 'string' ? invoice.customer    : null;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            await syncSubscription(sub, 'past_due');
          } catch {
            if (custId) await updateStatusByCustomer(custId, 'past_due');
          }
        }
        break;
      }

      // ── Payment succeeded (invoice) ──────────────────────────────────────────
      // Recovers from past_due after a successful retry.
      // Falls back to customer-based update if the subscription isn't retrievable.
      case 'invoice.paid': {
        const invoice  = event.data.object as Stripe.Invoice;
        const subId    = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        const custId   = typeof invoice.customer    === 'string' ? invoice.customer    : null;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            if (sub.status !== 'canceled') {
              await syncSubscription(sub, 'active');
            }
          } catch {
            if (custId) await updateStatusByCustomer(custId, 'active');
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
