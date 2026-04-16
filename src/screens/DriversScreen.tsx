// src/screens/DriversScreen.tsx
import React, { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal,
} from 'react-native';
import { useStore, Driver } from '../store';
import { Colors, Spacing, Radius } from '../utils/theme';
import { Card, SectionTitle, Avatar, Divider, PrimaryButton, SecondaryButton } from '../components/UI';
import { sendLocalNotification } from '../utils/notifications';

const EMPTY: Omit<Driver, 'id'> = { name: '', vehicle: '', plate: '', seats: 4, active: true };

export default function DriversScreen() {
  const drivers = useStore((s) => s.drivers);
  const addDriver = useStore((s) => s.addDriver);
  const updateDriver = useStore((s) => s.updateDriver);
  const removeDriver = useStore((s) => s.removeDriver);
  const toggleDriverActive = useStore((s) => s.toggleDriverActive);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<Omit<Driver, 'id'>>(EMPTY);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(drv: Driver) {
    setEditing(drv);
    setForm({ name: drv.name, vehicle: drv.vehicle, plate: drv.plate, seats: drv.seats, active: drv.active, phone: drv.phone });
    setModalOpen(true);
  }

  function save() {
    if (!form.name.trim() || !form.vehicle.trim()) {
      Alert.alert('Atenção', 'Nome e veículo são obrigatórios.');
      return;
    }
    if (editing) {
      updateDriver(editing.id, form);
    } else {
      addDriver(form);
    }
    setModalOpen(false);
  }

  function confirmRemove(drv: Driver) {
    Alert.alert('Remover motorista', `Remover ${drv.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeDriver(drv.id) },
    ]);
  }

  async function notifyDriver(drv: Driver) {
    await sendLocalNotification(
      '🚗 CaronaMais',
      `${drv.name}, atualize a disponibilidade do seu carro para este fim de semana!`
    );
    Alert.alert('Lembrete enviado!', `Notificação enviada para ${drv.name}.`);
  }

  async function notifyAll() {
    await sendLocalNotification('🚗 CaronaMais — Motoristas', 'Atualizem a disponibilidade dos carros para este fim de semana!');
    Alert.alert('Lembretes enviados!', `${drivers.length} motoristas notificados.`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Carros & Motoristas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Motorista</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <SectionTitle title="Frota" />
        {drivers.length === 0 && <Text style={styles.hint}>Nenhum motorista cadastrado.</Text>}
        {drivers.map((drv, i) => (
          <View key={drv.id}>
            {i > 0 && <Divider />}
            <View style={styles.driverRow}>
              <Avatar name={drv.name} index={i} size={40} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.driverName}>{drv.name}</Text>
                <Text style={styles.driverDetail}>{drv.vehicle} · {drv.plate} · {drv.seats} vagas</Text>
                <TouchableOpacity
                  style={[styles.statusPill, { backgroundColor: drv.active ? Colors.greenLight : Colors.grayLight }]}
                  onPress={() => toggleDriverActive(drv.id)}
                >
                  <View style={[styles.statusDot, { backgroundColor: drv.active ? Colors.greenMid : Colors.grayMid }]} />
                  <Text style={[styles.statusText, { color: drv.active ? Colors.green : Colors.gray }]}>
                    {drv.active ? 'Disponível' : 'Indisponível'} — toque para alternar
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(drv)} style={styles.actionBtn}>
                  <Text style={styles.actionEdit}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => notifyDriver(drv)} style={styles.actionBtn}>
                  <Text style={styles.actionNotif}>Lembrar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRemove(drv)} style={styles.actionBtn}>
                  <Text style={styles.actionDel}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </Card>

      {drivers.length > 0 && (
        <PrimaryButton label={`Notificar todos os ${drivers.length} motoristas`} onPress={notifyAll} />
      )}

      <View style={{ height: 32 }} />

      {/* Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Editar motorista' : 'Novo motorista'}</Text>

            <Text style={styles.label}>Nome completo</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Ex: Roberto Lima" placeholderTextColor={Colors.textHint} />

            <Text style={styles.label}>Veículo</Text>
            <TextInput style={styles.input} value={form.vehicle} onChangeText={(v) => setForm({ ...form, vehicle: v })} placeholder="Ex: Renault Kwid" placeholderTextColor={Colors.textHint} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Placa</Text>
                <TextInput style={styles.input} value={form.plate} onChangeText={(v) => setForm({ ...form, plate: v })} placeholder="ABC-1234" autoCapitalize="characters" placeholderTextColor={Colors.textHint} />
              </View>
              <View style={{ width: Spacing.sm }} />
              <View style={{ width: 80 }}>
                <Text style={styles.label}>Vagas</Text>
                <TextInput style={styles.input} value={String(form.seats)} onChangeText={(v) => setForm({ ...form, seats: parseInt(v) || 1 })} keyboardType="number-pad" maxLength={1} placeholderTextColor={Colors.textHint} />
              </View>
            </View>

            <Text style={styles.label}>WhatsApp (opcional)</Text>
            <TextInput style={styles.input} value={form.phone ?? ''} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+55 15 9..." keyboardType="phone-pad" placeholderTextColor={Colors.textHint} />

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
  hint: { fontSize: 13, color: Colors.textHint, textAlign: 'center', paddingVertical: 12 },
  driverRow: { flexDirection: 'row', paddingVertical: Spacing.md, alignItems: 'flex-start' },
  driverName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  driverDetail: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '500' },
  actions: { gap: 4, alignItems: 'flex-end' },
  actionBtn: { paddingVertical: 3 },
  actionEdit: { fontSize: 12, color: Colors.blue },
  actionNotif: { fontSize: 12, color: Colors.amber },
  actionDel: { fontSize: 12, color: Colors.coral },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.xl },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  input: { borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.background },
  row: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', marginTop: Spacing.xl },
});
