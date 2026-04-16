// src/screens/TripFormScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore, Leg, Trip } from '../store';
import { Colors, Spacing, Radius, fmtCurrency } from '../utils/theme';
import { Card, SectionTitle, Avatar, LegSelector, PrimaryButton, SecondaryButton, Divider } from '../components/UI';

export default function TripFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === 'new';

  const trips = useStore((s) => s.trips);
  const drivers = useStore((s) => s.drivers);
  const passengers = useStore((s) => s.passengers);
  const settings = useStore((s) => s.settings);
  const addTrip = useStore((s) => s.addTrip);
  const updateTrip = useStore((s) => s.updateTrip);
  const removeTrip = useStore((s) => s.removeTrip);

  const existing = trips.find((t) => t.id === id);

  // Today formatted
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(existing?.date ?? today);
  const [price, setPrice] = useState(String(existing?.pricePerLeg ?? settings.pricePerLeg));
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(
    new Set(existing?.driverIds ?? drivers.filter((d) => d.active).map((d) => d.id))
  );
  const [paxLegs, setPaxLegs] = useState<Record<string, { driverId: string; leg: Leg }>>(() => {
    if (existing) {
      const m: Record<string, { driverId: string; leg: Leg }> = {};
      for (const tp of existing.passengers) m[tp.passengerId] = { driverId: tp.driverId, leg: tp.leg };
      return m;
    }
    // default: all passengers, assigned to preferred driver, leg=both
    const m: Record<string, { driverId: string; leg: Leg }> = {};
    for (const pax of passengers) {
      const drv = pax.preferredDriverId ?? (drivers[0]?.id ?? '');
      m[pax.id] = { driverId: drv, leg: 'both' };
    }
    return m;
  });

  function toggleDriver(driverId: string) {
    setSelectedDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  }

  function save() {
    if (!date) { Alert.alert('Atenção', 'Informe a data da viagem.'); return; }
    if (selectedDrivers.size === 0) { Alert.alert('Atenção', 'Selecione ao menos um motorista.'); return; }

    const priceNum = parseFloat(price) || 0;
    const tripPassengers = Object.entries(paxLegs).map(([passengerId, { driverId, leg }]) => ({
      passengerId, driverId, leg,
    }));

    if (isNew) {
      addTrip({ date, driverIds: [...selectedDrivers], passengers: tripPassengers, pricePerLeg: priceNum });
    } else {
      updateTrip(id!, { date, driverIds: [...selectedDrivers], passengers: tripPassengers, pricePerLeg: priceNum });
    }
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Excluir viagem', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => { removeTrip(id!); router.back(); } },
    ]);
  }

  // Total
  const total = Object.values(paxLegs).reduce((a, { leg }) => {
    const priceNum = parseFloat(price) || 0;
    return a + (leg === 'both' ? 2 : leg === 'none' ? 0 : 1) * priceNum;
  }, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{isNew ? 'Nova viagem' : 'Editar viagem'}</Text>
        {!isNew && (
          <TouchableOpacity onPress={confirmDelete}>
            <Text style={styles.deleteBtn}>Excluir</Text>
          </TouchableOpacity>
        )}
      </View>

      <Card>
        <Text style={styles.label}>Data da viagem</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={Colors.textHint}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        <Text style={styles.label}>Valor por perna (R$)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholderTextColor={Colors.textHint}
        />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total estimado desta viagem:</Text>
          <Text style={styles.totalValue}>{fmtCurrency(total)}</Text>
        </View>
      </Card>

      {/* Driver selection */}
      <Card>
        <SectionTitle title="Motoristas desta viagem" />
        {drivers.map((drv, i) => (
          <View key={drv.id}>
            {i > 0 && <Divider />}
            <TouchableOpacity style={styles.driverRow} onPress={() => toggleDriver(drv.id)} activeOpacity={0.7}>
              <Avatar name={drv.name} index={i} size={36} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.driverName}>{drv.name}</Text>
                <Text style={styles.driverDetail}>{drv.vehicle} · {drv.seats} vagas</Text>
              </View>
              <View style={[styles.checkbox, selectedDrivers.has(drv.id) && styles.checkboxSel]}>
                {selectedDrivers.has(drv.id) && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      {/* Passenger legs */}
      <Card>
        <SectionTitle title="Passageiros" />
        {passengers.map((pax, i) => {
          const entry = paxLegs[pax.id] ?? { driverId: drivers[0]?.id ?? '', leg: 'both' as Leg };
          return (
            <View key={pax.id}>
              {i > 0 && <Divider />}
              <View style={styles.paxRow}>
                <Avatar name={pax.name} index={i} size={36} />
                <View style={{ flex: 1, marginLeft: Spacing.sm, gap: 6 }}>
                  <Text style={styles.paxName}>{pax.name}</Text>

                  {/* Driver assignment */}
                  <View style={styles.driverPicker}>
                    {[...selectedDrivers].map((drvId) => {
                      const drv = drivers.find((d) => d.id === drvId);
                      if (!drv) return null;
                      return (
                        <TouchableOpacity
                          key={drvId}
                          style={[styles.drvChip, entry.driverId === drvId && styles.drvChipSel]}
                          onPress={() => setPaxLegs((prev) => ({ ...prev, [pax.id]: { ...entry, driverId: drvId } }))}
                        >
                          <Text style={[styles.drvChipText, entry.driverId === drvId && styles.drvChipTextSel]}>{drv.name.split(' ')[0]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <LegSelector
                    value={entry.leg}
                    onChange={(leg) => setPaxLegs((prev) => ({ ...prev, [pax.id]: { ...entry, leg } }))}
                  />
                </View>
                <Text style={styles.paxAmt}>
                  {fmtCurrency((entry.leg === 'both' ? 2 : entry.leg === 'none' ? 0 : 1) * (parseFloat(price) || 0))}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>

      <PrimaryButton label="Salvar viagem" onPress={save} />
      <SecondaryButton label="Cancelar" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  deleteBtn: { fontSize: 14, color: Colors.coral, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  input: { borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth: 0.5, borderColor: Colors.border },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValue: { fontSize: 17, fontWeight: '700', color: Colors.green },
  driverRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  driverName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  driverDetail: { fontSize: 11, color: Colors.textSecondary },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkmark: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  paxRow: { flexDirection: 'row', paddingVertical: Spacing.md, alignItems: 'flex-start' },
  paxName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  paxAmt: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  driverPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  drvChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.background },
  drvChipSel: { backgroundColor: Colors.tealLight, borderColor: Colors.teal },
  drvChipText: { fontSize: 12, color: Colors.textSecondary },
  drvChipTextSel: { color: Colors.teal, fontWeight: '600' },
});
