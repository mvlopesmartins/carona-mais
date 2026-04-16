// src/screens/PassengersScreen.tsx
import React, { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal,
} from 'react-native';
import { useStore, Passenger } from '../store';
import { Colors, Spacing, Radius, fmtCurrency } from '../utils/theme';
import { Card, SectionTitle, Avatar, Divider, PrimaryButton, SecondaryButton } from '../components/UI';

const EMPTY: Omit<Passenger, 'id'> = { name: '', phone: '', preferredDriverId: undefined };

export default function PassengersScreen() {
  const passengers = useStore((s) => s.passengers);
  const drivers = useStore((s) => s.drivers);
  const trips = useStore((s) => s.trips);
  const settings = useStore((s) => s.settings);
  const addPassenger = useStore((s) => s.addPassenger);
  const updatePassenger = useStore((s) => s.updatePassenger);
  const removePassenger = useStore((s) => s.removePassenger);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Passenger | null>(null);
  const [form, setForm] = useState<Omit<Passenger, 'id'>>(EMPTY);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(p: Passenger) {
    setEditing(p);
    setForm({ name: p.name, phone: p.phone, preferredDriverId: p.preferredDriverId });
    setModalOpen(true);
  }

  function save() {
    if (!form.name.trim()) {
      Alert.alert('Atenção', 'Nome é obrigatório.');
      return;
    }
    if (editing) updatePassenger(editing.id, form);
    else addPassenger(form);
    setModalOpen(false);
  }

  function confirmRemove(p: Passenger) {
    Alert.alert('Remover passageiro', `Remover ${p.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removePassenger(p.id) },
    ]);
  }

  // Calculate total owed by passenger across all trips
  function paxTotal(paxId: string): number {
    let total = 0;
    for (const trip of trips) {
      const tp = trip.passengers.find((x) => x.passengerId === paxId);
      if (!tp) continue;
      const legs = tp.leg === 'both' ? 2 : tp.leg === 'none' ? 0 : 1;
      total += legs * trip.pricePerLeg;
    }
    return total;
  }

  function paxLegs(paxId: string): number {
    let total = 0;
    for (const trip of trips) {
      const tp = trip.passengers.find((x) => x.passengerId === paxId);
      if (!tp) continue;
      total += tp.leg === 'both' ? 2 : tp.leg === 'none' ? 0 : 1;
    }
    return total;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Passageiros</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Passageiro</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Valor por perna (ida ou volta)</Text>
          <View style={styles.priceEdit}>
            <Text style={styles.pricePrefix}>R$</Text>
            <TextInput
              style={styles.priceInput}
              value={String(settings.pricePerLeg)}
              onChangeText={(v) => useStore.getState().updateSettings({ pricePerLeg: parseFloat(v) || 0 })}
              keyboardType="decimal-pad"
              maxLength={6}
            />
            <Text style={styles.priceSuffix}>/ perna · R${(settings.pricePerLeg * 2).toFixed(2)} ida+volta</Text>
          </View>
        </View>
      </Card>

      <Card>
        <SectionTitle title={`${passengers.length} passageiros`} />
        {passengers.length === 0 && <Text style={styles.hint}>Nenhum passageiro cadastrado.</Text>}
        {passengers.map((pax, i) => {
          const drv = drivers.find((d) => d.id === pax.preferredDriverId);
          const total = paxTotal(pax.id);
          const legs = paxLegs(pax.id);
          return (
            <View key={pax.id}>
              {i > 0 && <Divider />}
              <View style={styles.paxRow}>
                <Avatar name={pax.name} index={i} size={40} />
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.paxName}>{pax.name}</Text>
                  <Text style={styles.paxDetail}>
                    {drv ? `${drv.name} · ${drv.vehicle}` : 'Sem motorista preferencial'}
                  </Text>
                  <Text style={styles.paxLegs}>{legs} pernas registradas</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.paxTotal}>{fmtCurrency(total)}</Text>
                  <Text style={styles.paxTotalLabel}>total geral</Text>
                  <View style={styles.rowBtns}>
                    <TouchableOpacity onPress={() => openEdit(pax)} style={styles.miniBtn}>
                      <Text style={styles.miniBtnEdit}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmRemove(pax)} style={styles.miniBtn}>
                      <Text style={styles.miniBtnDel}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      <View style={{ height: 32 }} />

      {/* Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Editar passageiro' : 'Novo passageiro'}</Text>

            <Text style={styles.label}>Nome completo</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Ex: Ana Souza" placeholderTextColor={Colors.textHint} />

            <Text style={styles.label}>WhatsApp (opcional)</Text>
            <TextInput style={styles.input} value={form.phone ?? ''} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+55 15 9..." keyboardType="phone-pad" placeholderTextColor={Colors.textHint} />

            <Text style={styles.label}>Motorista preferencial</Text>
            <View style={styles.driverPicker}>
              <TouchableOpacity
                style={[styles.driverOption, !form.preferredDriverId && styles.driverOptionSel]}
                onPress={() => setForm({ ...form, preferredDriverId: undefined })}
              >
                <Text style={[styles.driverOptionText, !form.preferredDriverId && styles.driverOptionTextSel]}>Sem preferência</Text>
              </TouchableOpacity>
              {drivers.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.driverOption, form.preferredDriverId === d.id && styles.driverOptionSel]}
                  onPress={() => setForm({ ...form, preferredDriverId: d.id })}
                >
                  <Text style={[styles.driverOptionText, form.preferredDriverId === d.id && styles.driverOptionTextSel]}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <SecondaryButton label="Cancelar" onPress={() => setModalOpen(false)} style={{ flex: 1 }} />
              <View style={{ width: Spacing.sm }} />
              <PrimaryButton label="Salvar" onPress={save} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.green, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  priceRow: { gap: Spacing.sm },
  priceLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  priceEdit: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pricePrefix: { fontSize: 18, color: Colors.textSecondary, fontWeight: '500' },
  priceInput: { fontSize: 22, fontWeight: '700', color: Colors.green, borderBottomWidth: 1.5, borderColor: Colors.green, paddingVertical: 2, minWidth: 60, textAlign: 'center' },
  priceSuffix: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  hint: { fontSize: 13, color: Colors.textHint, textAlign: 'center', paddingVertical: 12 },
  paxRow: { flexDirection: 'row', paddingVertical: Spacing.md, alignItems: 'flex-start' },
  paxName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  paxDetail: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  paxLegs: { fontSize: 11, color: Colors.textHint },
  paxTotal: { fontSize: 15, fontWeight: '700', color: Colors.coral },
  paxTotalLabel: { fontSize: 10, color: Colors.textHint },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  miniBtn: {},
  miniBtnEdit: { fontSize: 11, color: Colors.blue },
  miniBtnDel: { fontSize: 11, color: Colors.coral },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.xl },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  input: { borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.background },
  driverPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  driverOption: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.background },
  driverOptionSel: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  driverOptionText: { fontSize: 13, color: Colors.textSecondary },
  driverOptionTextSel: { color: Colors.green, fontWeight: '600' },
  modalActions: { flexDirection: 'row', marginTop: Spacing.xl },
});
