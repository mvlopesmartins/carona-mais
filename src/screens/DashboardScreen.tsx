// src/screens/DashboardScreen.tsx
import React, { useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../store';
import { Colors, Spacing, Radius, fmtCurrency, fmtDate, legColor, legLabel, getWeekKey, MONTH_NAMES } from '../utils/theme';
import { Card, SectionTitle, Avatar, LegBadge, MetricCard } from '../components/UI';

export default function DashboardScreen() {
  const router = useRouter();
  const { trips, drivers, passengers, settings } = useStore();
  const getMonthReport = useStore((s) => s.getMonthReport);

  const now = new Date();
  const report = useMemo(() => getMonthReport(now.getFullYear(), now.getMonth() + 1), [trips]);

  const sortedTrips = useMemo(() => [...trips].sort((a, b) => b.date.localeCompare(a.date)), [trips]);
  const recentTrips = sortedTrips.slice(0, 3);

  // Next Saturday or trip day
  const nextTripDate = useMemo(() => {
    const d = new Date();
    const tripDay = settings.tripDay; // 6=Sat
    const diff = (tripDay - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  }, [settings.tripDay]);

  const nextTripStr = nextTripDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const weekKey = getWeekKey(nextTripDate);
  const weekConfs = useStore((s) => s.weekConfirmations.filter((w) => w.weekKey === weekKey && w.leg !== 'none'));

  const activeDrivers = drivers.filter((d) => d.active);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CaronaMais</Text>
          <Text style={styles.headerSub}>Cesário Lange → Laranjal Paulista</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/trip/new')}>
          <Text style={styles.addBtnText}>+ Viagem</Text>
        </TouchableOpacity>
      </View>

      {/* Month metrics */}
      <Card>
        <SectionTitle title={`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`} />
        <View style={styles.metricsRow}>
          <MetricCard label="Viagens" value={String(report.totalTrips)} sub="este mês" />
          <View style={{ width: Spacing.sm }} />
          <MetricCard label="Passageiros" value={String(passengers.length)} sub="cadastrados" />
          <View style={{ width: Spacing.sm }} />
          <MetricCard label="A receber" value={fmtCurrency(report.totalAmount)} accent />
        </View>
      </Card>

      {/* Next trip */}
      <Card>
        <SectionTitle title="Próxima viagem" />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: Colors.greenMid }]} />
          <View style={styles.routeLine} />
          <Text style={styles.routeKm}>37 km</Text>
          <View style={styles.routeLine} />
          <View style={[styles.routeDot, { backgroundColor: Colors.tealMid }]} />
        </View>
        <View style={styles.routeLabels}>
          <Text style={styles.routeLabel}>Cesário Lange</Text>
          <Text style={styles.routeLabel}>Laranjal Paulista</Text>
        </View>
        <Text style={styles.nextDate}>{nextTripStr}</Text>

        {activeDrivers.length === 0 ? (
          <Text style={styles.hintText}>Nenhum motorista ativo. Cadastre em "Carros".</Text>
        ) : (
          activeDrivers.map((drv, i) => {
            const paxInCar = weekConfs.filter(
              (w) => passengers.find((p) => p.id === w.passengerId)?.preferredDriverId === drv.id
            ).length;
            return (
              <View key={drv.id} style={styles.carRow}>
                <Avatar name={drv.name} index={i} size={36} />
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.carName}>{drv.vehicle} — {drv.name}</Text>
                  <Text style={styles.carDetail}>{drv.seats} vagas · {paxInCar} confirmados</Text>
                </View>
              </View>
            );
          })
        )}
      </Card>

      {/* Recent trips */}
      <Card>
        <SectionTitle title="Últimas viagens" action="Ver todas" onAction={() => router.push('/trips')} />
        {recentTrips.length === 0 && <Text style={styles.hintText}>Nenhuma viagem registrada ainda.</Text>}
        {recentTrips.map((trip, i) => {
          const totalAmt = trip.passengers.reduce((a, tp) => {
            const legs = tp.leg === 'both' ? 2 : tp.leg === 'none' ? 0 : 1;
            return a + legs * trip.pricePerLeg;
          }, 0);
          const paxCount = trip.passengers.filter((tp) => tp.leg !== 'none').length;
          const mainLeg = trip.passengers.some((tp) => tp.leg === 'both') ? 'both'
            : trip.passengers.every((tp) => tp.leg === 'go') ? 'go' : 'back';

          return (
            <TouchableOpacity key={trip.id} style={[styles.tripRow, i < recentTrips.length - 1 && styles.tripBorder]}
              onPress={() => router.push(`/trip/${trip.id}`)}>
              <Text style={styles.tripDate}>{fmtDate(trip.date)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripName}>Cesário → Laranjal</Text>
                <Text style={styles.tripDetail}>{paxCount} passageiros · {trip.driverIds.length} carros</Text>
              </View>
              <LegBadge leg={mainLeg} />
              <Text style={styles.tripAmt}>{fmtCurrency(totalAmt)}</Text>
            </TouchableOpacity>
          );
        })}
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontFamily: 'monospace' },
  addBtn: {
    backgroundColor: Colors.green, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  metricsRow: { flexDirection: 'row' },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  routeKm: { fontSize: 10, color: Colors.textHint, marginHorizontal: 6 },
  routeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  routeLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  nextDate: { fontSize: 12, color: Colors.green, fontWeight: '600', marginBottom: Spacing.md },
  carRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 0.5, borderColor: Colors.border },
  carName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  carDetail: { fontSize: 11, color: Colors.textSecondary },
  hintText: { fontSize: 13, color: Colors.textHint, textAlign: 'center', paddingVertical: 12 },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  tripBorder: { borderBottomWidth: 0.5, borderColor: Colors.border },
  tripDate: { fontSize: 11, fontFamily: 'monospace', color: Colors.textSecondary, width: 50 },
  tripName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  tripDetail: { fontSize: 11, color: Colors.textSecondary },
  tripAmt: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
});
