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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Reservation } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

const STATUS_CONFIG: Record<Reservation['status'], { color: string; label: string }> = {
  confirmed: { color: Colors.success, label: 'CONFIRMED' },
  pending:   { color: Colors.warning, label: 'PENDING'   },
  cancelled: { color: Colors.error,   label: 'CANCELLED' },
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
  const insets = useSafeAreaInsets();
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MY RESERVATIONS</Text>
        <View style={styles.headerSide} />
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.stateIcon}>⚠</Text>
          <Text style={styles.stateTitle}>COULDN'T LOAD RESERVATIONS</Text>
          <Text style={styles.stateSub}>{error}</Text>
          <TouchableOpacity style={styles.pillBtn} onPress={() => fetchReservations()}>
            <Text style={styles.pillBtnText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.stateIcon}>◻</Text>
          <Text style={styles.stateTitle}>NO RESERVATIONS YET</Text>
          <Text style={styles.stateSub}>BOOK A TABLE TO SEE YOUR RESERVATIONS HERE.</Text>
          <TouchableOpacity
            style={[styles.pillBtn, { marginTop: Layout.spacing.md }]}
            onPress={() => router.push('/reservations')}
          >
            <Text style={styles.pillBtnText}>MAKE A RESERVATION</Text>
          </TouchableOpacity>
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
              tintColor={Colors.textMuted}
            />
          }
        />
      )}
    </View>
  );
}

function ReservationCard({ reservation: r }: { reservation: Reservation }) {
  const statusCfg = STATUS_CONFIG[r.status];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardDateBlock}>
          <Text style={styles.cardDate}>{formatDate(r.date).toUpperCase()}</Text>
          <Text style={styles.cardTime}>
            {r.time} · {r.guests} {r.guests === 1 ? 'GUEST' : 'GUESTS'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusCfg.color }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>
      {r.notes ? (
        <View style={styles.cardNotes}>
          <Text style={styles.cardNotesLabel}>NOTES</Text>
          <Text style={styles.cardNotesText}>{r.notes.toUpperCase()}</Text>
        </View>
      ) : null}
      <Text style={styles.cardMeta}>
        BOOKED {new Date(r.created_at).toLocaleDateString('en-GB').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    height: Layout.headerHeight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCard,
  },
  headerSide: { width: 44, alignItems: 'flex-start' },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },

  list: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxxl,
  },

  card: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Layout.spacing.sm,
  },
  cardDateBlock: { flex: 1, gap: 4 },
  cardDate: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.tight,
  },
  cardTime: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    letterSpacing: Layout.letterSpacing.wider,
  },

  statusBadge: {
    borderWidth: 1,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },

  cardNotes: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.card,
    padding: Layout.spacing.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  cardNotesLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },
  cardNotesText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    letterSpacing: Layout.letterSpacing.wider,
  },

  cardMeta: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: Layout.letterSpacing.wider,
  },

  // Empty / error states
  centered: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  stateIcon: { fontSize: 48, textAlign: 'center', color: Colors.textMuted },
  stateTitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: Layout.letterSpacing.wider,
  },
  stateSub: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: Layout.letterSpacing.wider,
  },

  pillBtn: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
    alignItems: 'center',
  },
  pillBtnText: {
    color: Colors.background,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    letterSpacing: Layout.letterSpacing.wider,
  },
});
