import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RestaurantMembership, CoffeeClaim } from '@/lib/types';
import { format, isPast, parseISO } from 'date-fns';

export function useMembership(userId: string | undefined) {
  const [membership, setMembership] = useState<RestaurantMembership | null>(null);
  const [coffeeClaim, setCoffeeClaim] = useState<CoffeeClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMonthYear = format(new Date(), 'yyyy-MM');

  const fetchMembership = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setMembership(null);
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('restaurant_memberships')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMembership(data);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [userId]);

  const fetchCoffeeClaim = useCallback(async () => {
    if (!userId) return;
    const { data, error: fetchError } = await supabase
      .from('coffee_claims')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonthYear)
      .maybeSingle();
    if (!fetchError) setCoffeeClaim(data);
  }, [userId, currentMonthYear]);

  useEffect(() => {
    fetchMembership();
    fetchCoffeeClaim();
  }, [fetchMembership, fetchCoffeeClaim]);

  async function claimCoffee() {
    if (!userId) throw new Error('Not authenticated');
    if (!isPremium) throw new Error('Premium membership required');
    if (hasClaimedThisMonth) throw new Error('Already claimed this month');

    const { data, error: claimError } = await supabase
      .from('coffee_claims')
      .insert({ user_id: userId, month_year: currentMonthYear })
      .select()
      .single();
    if (claimError) throw claimError;
    setCoffeeClaim(data);
    return data;
  }

  // ── Derived membership state ────────────────────────────────────────────────

  const isPremium = membership?.status === 'active';

  const isPastDue = membership?.status === 'past_due';

  // User is active but has a cancellation scheduled — access remains until cancel_at / period end
  const isCancelledPending =
    membership?.status === 'active' &&
    !!membership?.cancel_at_period_end;

  // User's subscription is fully cancelled in Stripe but the paid period hasn't expired yet
  const isCancelledWithAccess =
    membership?.status === 'cancelled' &&
    !!membership?.current_period_end &&
    !isPast(parseISO(membership.current_period_end));

  // Any state that still grants access to premium features
  const hasAccess = isPremium || isPastDue || isCancelledWithAccess;

  const hasClaimedThisMonth = !!coffeeClaim;

  const refetch = useCallback(() => {
    fetchMembership();
    fetchCoffeeClaim();
  }, [fetchMembership, fetchCoffeeClaim]);

  const refresh = useCallback(() => {
    fetchMembership(true);
    fetchCoffeeClaim();
  }, [fetchMembership, fetchCoffeeClaim]);

  return {
    membership,
    coffeeClaim,
    loading,
    refreshing,
    error,
    isPremium,
    isPastDue,
    isCancelledPending,
    isCancelledWithAccess,
    hasAccess,
    hasClaimedThisMonth,
    claimCoffee,
    refetch,
    refresh,
  };
}
