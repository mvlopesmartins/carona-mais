// src/screens/ReportScreen.tsx
import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { useStore } from '../store';
import { Colors, Spacing, Radius, fmtCurrency, MONTH_NAMES, avatarColor, initials } from '../utils/theme';
import { Card, SectionTitle, Avatar, MetricCard, Divider } from '../components/UI';

export default function ReportScreen() {
  const getMonthReport = useStore((s) => s.getMonthReport);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const report = useMemo(() => getMonthReport(year, month), [year, month, useStore.getState().trips]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function shareReport() {
    let text = `📊 Relatório de Caronas — ${MONTH_NAMES[month - 1]} ${year}\n`;
    text += `Cesário Lange → Laranjal Paulista\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Total de viagens: ${report.totalTrips}\n`;
    text += `Total de pernas: ${report.totalLegs}\n`;
    text += `Total a receber: ${fmtCurrency(report.totalAmount)}\n\n`;

    for (const drv of report.byDriver) {
      text += `🚗 ${drv.driverName} — ${fmtCurrency(drv.subtotal)}\n`;
      for (const pax of drv.passengers) {
        text += `  • ${pax.passengerName}: ${pax.legs} pernas = ${fmtCurrency(pax.amount)}\n`;
      }
      text += '\n';
    }

    text += `📌 Por passageiro:\n`;
    for (const pax of report.byPassenger) {
      text += `  • ${pax.passengerName}: ${fmtCurrency(pax.amount)}\n`;
    }

    await Share.share({ message: text, title: `CaronaMais — ${MONTH_NAMES[month - 1]} ${year}` });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatório mensal</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={shareReport}>
          <Text style={styles.shareBtnText}>Compartilhar</Text>
        </TouchableOpacity>
      </View>

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTH_NAMES[month - 1]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Totals */}
      <View style={styles.metricsRow}>
        <MetricCard label="Viagens" value={String(report.totalTrips)} />
        <View style={{ width: Spacing.sm }} />
        <MetricCard label="Pernas" value={String(report.totalLegs)} />
        <View style={{ width: Spacing.sm }} />
        <MetricCard label="Total" value={fmtCurrency(report.totalAmount)} accent />
      </View>

      {/* By driver */}
      {report.byDriver.length === 0 && (
        <Card><Text style={styles.empty}>Nenhuma viagem registrada neste período.</Text></Card>
      )}

      {report.byDriver.map((drv, di) => (
        <Card key={drv.driverId}>
          <View style={styles.driverHeader}>
            <Avatar name={drv.driverName} index={di} size={38} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.driverName}>{drv.driverName}</Text>
              <Text style={styles.driverSub}>{drv.passengers.length} passageiros</Text>
            </View>
            <Text style={styles.driverTotal}>{fmtCurrency(drv.subtotal)}</Text>
          </View>

          <Divider />

          {drv.passengers.map((pax, pi) => {
            const c = avatarColor(pi);
            return (
              <View key={pax.passengerId} style={styles.paxRow}>
                <View style={[styles.paxDot, { backgroundColor: c.bg, borderColor: c.text }]} />
                <Text style={styles.paxName}>{pax.passengerName}</Text>
                <Text style={styles.paxLegs}>{pax.legs}x</Text>
                <Text style={styles.paxAmount}>{fmtCurrency(pax.amount)}</Text>
              </View>
            );
          })}

          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal {drv.driverName.split(' ')[0]}</Text>
            <Text style={styles.subtotalValue}>{fmtCurrency(drv.subtotal)}</Text>
          </View>
        </Card>
      ))}

      {/* By passenger summary */}
      {report.byPassenger.length > 0 && (
        <Card>
          <SectionTitle title="Resumo por passageiro" />
          {report.byPassenger.map((pax, i) => (
            <View key={pax.passengerId}>
              {i > 0 && <Divider />}
              <View style={styles.paxSummaryRow}>
                <Avatar name={pax.passengerName} index={i} size={32} />
                <Text style={styles.paxSummaryName}>{pax.passengerName}</Text>
                <Text style={styles.paxSummaryLegs}>{pax.legs} perna{pax.legs !== 1 ? 's' : ''}</Text>
                <Text style={styles.paxSummaryAmt}>{fmtCurrency(pax.amount)}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  shareBtn: { backgroundColor: Colors.green, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  shareBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, gap: Spacing.xl },
  navBtn: { padding: Spacing.sm },
  navArrow: { fontSize: 28, color: Colors.textSecondary, fontWeight: '300' },
  monthLabel: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, minWidth: 160, textAlign: 'center' },
  metricsRow: { flexDirection: 'row', marginBottom: Spacing.md },
  empty: { fontSize: 13, color: Colors.textHint, textAlign: 'center', paddingVertical: 16 },
  driverHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  driverName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  driverSub: { fontSize: 11, color: Colors.textSecondary },
  driverTotal: { fontSize: 17, fontWeight: '700', color: Colors.coral },
  paxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8 },
  paxDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  paxName: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  paxLegs: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'monospace', minWidth: 28 },
  paxAmount: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 0.5, borderColor: Colors.border, marginTop: Spacing.xs },
  subtotalLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  subtotalValue: { fontSize: 15, fontWeight: '700', color: Colors.green },
  paxSummaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  paxSummaryName: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  paxSummaryLegs: { fontSize: 11, color: Colors.textSecondary },
  paxSummaryAmt: { fontSize: 14, fontWeight: '700', color: Colors.coral },
});
