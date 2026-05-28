-- ============================================================
-- Migration 026 — Stripe subscription improvements
-- Adds cancel_at_period_end and cancel_at columns so the app
-- can show users when a scheduled cancellation will take effect,
-- without changing the status value until Stripe fires the
-- customer.subscription.deleted event.
-- ============================================================

ALTER TABLE public.restaurant_memberships
  ADD COLUMN IF NOT EXISTS cancel_at_period_end  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel_at             timestamptz;

COMMENT ON COLUMN public.restaurant_memberships.cancel_at_period_end IS
  'True when the user has cancelled via Stripe but access remains until current_period_end.';

COMMENT ON COLUMN public.restaurant_memberships.cancel_at IS
  'Timestamp when the subscription will actually terminate (null if not scheduled).';
