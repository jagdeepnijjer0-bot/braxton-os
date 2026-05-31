import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Reservation } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

const STATUS_CONFIG: Record<Reservation['status'], { variant: BadgeVariant; label: string }> = {
  confirmed: { variant: 'success', label: 'Confirmed' },
  pending:   { variant: 'warning', label: 'Pending'   },
  cancelled: { variant: 'error',   label: 'Cancelled' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function MyReservationsScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const fetchReservations = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setReservations(data ?? []);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reservations</Text>
        <View style={styles.backBtn} />
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Couldn't load reservations</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <Button title="Try Again" onPress={() => fetchReservations()} fullWidth />
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No reservations yet</Text>
          <Text style={styles.emptySub}>Book a table to see your reservations here.</Text>
          <Button
            title="Make a Reservation"
            onPress={() => router.push('/reservations')}
            fullWidth
            style={{ marginTop: Layout.spacing.md }}
          />
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReservationCard reservation={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchReservations(true)}
              tintColor={Colors.gold}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function ReservationCard({ reservation: r }: { reservation: Reservation }) {
  const statusCfg = STATUS_CONFIG[r.status];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardDateBlock}>
          <Text style={styles.cardDate}>{formatDate(r.date)}</Text>
          <Text style={styles.cardTime}>{r.time} · {r.guests} {r.guests === 1 ? 'guest' : 'guests'}</Text>
        </View>
        <Badge label={statusCfg.label} variant={statusCfg.variant} />
      </View>
      {r.notes ? (
        <View style={styles.cardNotes}>
          <Text style={styles.cardNotesLabel}>Notes</Text>
          <Text style={styles.cardNotesText}>{r.notes}</Text>
        </View>
      ) : null}
      <Text style={styles.cardMeta}>Booked {new Date(r.created_at).toLocaleDateString('en-GB')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:     { width: 70 },
  backText:    { fontSize: Layout.fontSize.base, color: Colors.gold, fontWeight: '600' },
  headerTitle: { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '700' },

  list: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxxl,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Layout.spacing.sm,
  },
  cardDateBlock: { flex: 1, gap: 2 },
  cardDate:      { fontSize: Layout.fontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  cardTime:      { fontSize: Layout.fontSize.sm,   color: Colors.textSecondary },

  cardNotes: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Layout.borderRadius.sm,
    padding: Layout.spacing.sm,
    gap: 2,
  },
  cardNotesLabel: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  cardNotesText:  { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

  cardMeta: { fontSize: Layout.fontSize.xs, color: Colors.textMuted },

  // Empty / error states
  centered: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  emptyIcon:  { fontSize: 48, textAlign: 'center' },
  emptyTitle: { fontSize: Layout.fontSize.xl, color: Colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  emptySub:   { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  errorIcon: { fontSize: 40, textAlign: 'center' },
  errorText: { fontSize: Layout.fontSize.base, color: Colors.error, fontWeight: '600', textAlign: 'center' },
  errorSub:  { fontSize: Layout.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
