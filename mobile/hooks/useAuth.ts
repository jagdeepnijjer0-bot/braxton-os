import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

export function useAuth() {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('restaurant_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();          // safe when trigger hasn't fired yet
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return;
    const { error } = await supabase
      .from('restaurant_profiles')
      .upsert({ id: user.id, email: user.email!, ...updates, updated_at: new Date().toISOString() });
    if (error) throw error;
    await fetchProfile(user.id);
  }

  function refreshProfile() {
    if (user) fetchProfile(user.id);
  }

  return {
    session,
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!session,
  };
}
