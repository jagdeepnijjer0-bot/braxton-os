import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RestaurantMembership, CoffeeClaim } from '@/lib/types';
import { format } from 'date-fns';

export function useMembership(userId: string | undefined) {
  const [membership, setMembership] = useState<RestaurantMembership | null>(null);
  const [coffeeClaim, setCoffeeClaim] = useState<CoffeeClaim | null>(null);
  const [loading, setLoading] = useState(true);

  const currentMonthYear = format(new Date(), 'yyyy-MM');

  const fetchMembership = useCallback(async () => {
    if (!userId) {
      setMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('restaurant_memberships')
      .select('*')
      .eq('user_id', userId)
      .single();
    setMembership(data);
    setLoading(false);
  }, [userId]);

  const fetchCoffeeClaim = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('coffee_claims')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonthYear)
      .single();
    setCoffeeClaim(data);
  }, [userId, currentMonthYear]);

  useEffect(() => {
    fetchMembership();
    fetchCoffeeClaim();
  }, [fetchMembership, fetchCoffeeClaim]);

  async function claimCoffee() {
    if (!userId) throw new Error('Not authenticated');
    if (!isPremium) throw new Error('Premium membership required');
    if (hasClaimedThisMonth) throw new Error('Already claimed this month');

    const { data, error } = await supabase
      .from('coffee_claims')
      .insert({ user_id: userId, month_year: currentMonthYear })
      .select()
      .single();
    if (error) throw error;
    setCoffeeClaim(data);
    return data;
  }

  const isPremium = membership?.status === 'active';
  const hasClaimedThisMonth = !!coffeeClaim;

  return {
    membership,
    coffeeClaim,
    loading,
    isPremium,
    hasClaimedThisMonth,
    claimCoffee,
    refetch: () => { fetchMembership(); fetchCoffeeClaim(); },
  };
}
