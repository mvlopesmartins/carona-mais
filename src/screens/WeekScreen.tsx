// src/screens/WeekScreen.tsx
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useStore, Leg } from '../store';
import { Colors, Spacing, Radius, getWeekKey } from '../utils/theme';
import { Card, SectionTitle, Avatar, LegSelector, PrimaryButton, Divider } from '../components/UI';
import { sendLocalNotification } from '../utils/notifications';

export default function WeekScreen() {
  const passengers = useStore((s) => s.passengers);
  const drivers = useStore((s) => s.drivers);
  const settings = useStore((s) => s.settings);
  const getWeekConfirmation = useStore((s) => s.getWeekConfirmation);
  const setWeekConfirmation = useStore((s) => s.setWeekConfirmation);

  const now = new Date();
  const [selectedDate] = useState(now);
  const weekKey = getWeekKey(selectedDate);

  // Next trip date
  const nextTrip = useMemo(() => {
    const d = new Date();
    const diff = (settings.tripDay - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  }, [settings.tripDay]);

  const confirmed = passengers.filter((p) => {
    const leg = getWeekConfirmation(weekKey, p.id);
    return leg !== 'none';
  });

  const pending = passengers.filter((p) => {
    const leg = getWeekConfirmation(weekKey, p.id);
    return leg === 'none';
  });

  async function sendReminder() {
    await sendLocalNotification(
      '🚗 CaronaMais',
      `Lembrete enviado para ${passengers.length} passageiros!`
    );
    Alert.alert('Lembrete enviado!', `${passengers.length} passageiros foram notificados.`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Semana atual</Text>
        <Text style={styles.subtitle}>
          Viagem: {nextTrip.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
        </Text>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryItem, { backgroundColor: Colors.greenLight }]}>
          <Text style={[styles.summaryNum, { color: Colors.green }]}>{confirmed.length}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.green }]}>Confirmados</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: Colors.amberLight }]}>
          <Text style={[styles.summaryNum, { color: Colors.amber }]}>{pending.length}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.amber }]}>Pendentes</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: Colors.tealLight }]}>
          <Text style={[styles.summaryNum, { color: Colors.teal }]}>
            {drivers.filter((d) => d.active).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: Colors.teal }]}>Carros</Text>
        </View>
      </View>

      {/* Passenger confirmations */}
      <Card>
        <SectionTitle title="Confirmações" />
        {passengers.map((pax, i) => {
          const leg = getWeekConfirmation(weekKey, pax.id);
          const drv = drivers.find((d) => d.id === pax.preferredDriverId);
          return (
            <View key={pax.id}>
              {i > 0 && <Divider />}
              <View style={styles.paxRow}>
                <Avatar name={pax.name} index={i} size={38} />
                <View style={styles.paxInfo}>
                  <Text style={styles.paxName}>{pax.name}</Text>
                  {drv && <Text style={styles.paxDriver}>{drv.name} · {drv.vehicle}</Text>}
                  <LegSelector
                    value={leg as Leg}
                    onChange={(l) => setWeekConfirmation(weekKey, pax.id, l)}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      {/* Driver availability */}
      <Card>
        <SectionTitle title="Disponibilidade dos carros" />
        {drivers.map((drv, i) => (
          <View key={drv.id}>
            {i > 0 && <Divider />}
            <View style={styles.driverRow}>
              <Avatar name={drv.name} index={i} size={36} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.driverName}>{drv.name}</Text>
                <Text style={styles.driverDetail}>{drv.vehicle} · {drv.seats} vagas</Text>
              </View>
              <TouchableOpacity
                style={[styles.statusPill, { backgroundColor: drv.active ? Colors.greenLight : Colors.grayLight }]}
                onPress={() => useStore.getState().toggleDriverActive(drv.id)}
              >
                <View style={[styles.statusDot, { backgroundColor: drv.active ? Colors.greenMid : Colors.grayMid }]} />
                <Text style={[styles.statusText, { color: drv.active ? Colors.green : Colors.gray }]}>
                  {drv.active ? 'Disponível' : 'Indisponível'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </Card>

      {/* Notify button */}
      <PrimaryButton label={`Enviar lembrete para ${passengers.length} passageiros`} onPress={sendReminder} />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryItem: { flex: 1, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  summaryNum: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  paxRow: { flexDirection: 'row', paddingVertical: Spacing.md, gap: Spacing.sm },
  paxInfo: { flex: 1, gap: 4 },
  paxName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  paxDriver: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  driverRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  driverName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  driverDetail: { fontSize: 11, color: Colors.textSecondary },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
});
