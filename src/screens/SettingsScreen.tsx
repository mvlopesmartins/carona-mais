// src/screens/SettingsScreen.tsx
import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useStore } from '../store';
import { Colors, Spacing, Radius } from '../utils/theme';
import { Card, SectionTitle, Divider } from '../components/UI';
import {
  registerForPushNotifications,
  schedulePassengerReminder,
  scheduleDriverReminder,
  cancelAllNotifications,
} from '../utils/notifications';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function SettingsScreen() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [notifEnabled, setNotifEnabled] = React.useState(false);

  useEffect(() => {
    registerForPushNotifications().then((token) => setNotifEnabled(!!token));
  }, []);

  async function toggleNotifications(val: boolean) {
    if (val) {
      const token = await registerForPushNotifications();
      if (!token) { Alert.alert('Permissão negada', 'Habilite notificações nas configurações do sistema.'); return; }
      await schedulePassengerReminder(settings.notifyPassengersDay);
      await scheduleDriverReminder(settings.notifyDriversDay);
      setNotifEnabled(true);
    } else {
      await cancelAllNotifications();
      setNotifEnabled(false);
    }
  }

  async function updatePassengerNotifDay(day: number) {
    updateSettings({ notifyPassengersDay: day });
    if (notifEnabled) await schedulePassengerReminder(day);
  }

  async function updateDriverNotifDay(day: number) {
    updateSettings({ notifyDriversDay: day });
    if (notifEnabled) await scheduleDriverReminder(day);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Configurações</Text>

      {/* Trip config */}
      <Card>
        <SectionTitle title="Viagem" />
        <Text style={styles.label}>Dia padrão da viagem</Text>
        <View style={styles.dayRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayBtn, settings.tripDay === i && styles.dayBtnSel]}
              onPress={() => updateSettings({ tripDay: i })}
            >
              <Text style={[styles.dayBtnText, settings.tripDay === i && styles.dayBtnTextSel]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Divider />

        <Text style={styles.label}>Período do relatório</Text>
        <View style={styles.chipRow}>
          {(['monthly', 'biweekly', 'weekly'] as const).map((p) => {
            const labels = { monthly: 'Mensal', biweekly: 'Quinzenal', weekly: 'Semanal' };
            return (
              <TouchableOpacity
                key={p}
                style={[styles.chip, settings.reportPeriod === p && styles.chipSel]}
                onPress={() => updateSettings({ reportPeriod: p })}
              >
                <Text style={[styles.chipText, settings.reportPeriod === p && styles.chipTextSel]}>{labels[p]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Notifications */}
      <Card>
        <SectionTitle title="Notificações" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Lembretes automáticos ativos</Text>
          <Switch
            value={notifEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ true: Colors.green }}
            thumbColor={Colors.white}
          />
        </View>

        <Divider />

        <Text style={styles.label}>Lembrar passageiros no dia</Text>
        <View style={styles.dayRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayBtn, settings.notifyPassengersDay === i && styles.dayBtnSel]}
              onPress={() => updatePassengerNotifDay(i)}
            >
              <Text style={[styles.dayBtnText, settings.notifyPassengersDay === i && styles.dayBtnTextSel]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: Spacing.md }]}>Lembrar motoristas no dia</Text>
        <View style={styles.dayRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayBtn, settings.notifyDriversDay === i && styles.dayBtnSel]}
              onPress={() => updateDriverNotifDay(i)}
            >
              <Text style={[styles.dayBtnText, settings.notifyDriversDay === i && styles.dayBtnTextSel]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoBox, { marginTop: Spacing.md }]}>
          <Text style={styles.infoText}>
            Passageiros são notificados às 18h do dia selecionado para confirmarem presença.{'\n'}
            Motoristas são notificados às 17h para atualizarem disponibilidade do carro.
          </Text>
        </View>
      </Card>

      {/* About */}
      <Card>
        <SectionTitle title="Sobre" />
        <Text style={styles.aboutText}>CaronaMais v1.0</Text>
        <Text style={styles.aboutSub}>Gestão de caronas semanais{'\n'}Cesário Lange → Laranjal Paulista</Text>
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, marginBottom: 8 },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.background, alignItems: 'center' },
  dayBtnSel: { backgroundColor: Colors.green, borderColor: Colors.green },
  dayBtnText: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary },
  dayBtnTextSel: { color: Colors.white, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.background },
  chipSel: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextSel: { color: Colors.green, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchLabel: { fontSize: 14, color: Colors.textPrimary },
  infoBox: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md },
  infoText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  aboutText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  aboutSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
});
