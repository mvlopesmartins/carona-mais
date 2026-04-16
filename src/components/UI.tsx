// src/components/UI.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography, avatarColor, initials, fmtCurrency, legLabel, legColor } from '../utils/theme';
import type { Leg } from '../store';

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, index, size = 40 }: { name: string; index: number; size?: number }) {
  const color = avatarColor(index);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color.bg }]}>
      <Text style={[styles.avatarText, { color: color.text, fontSize: size * 0.32 }]}>{initials(name)}</Text>
    </View>
  );
}

// ─── LegBadge ─────────────────────────────────────────────────────────────────
export function LegBadge({ leg }: { leg: Leg }) {
  const c = legColor(leg);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{legLabel(leg)}</Text>
    </View>
  );
}

// ─── LegSelector ──────────────────────────────────────────────────────────────
export function LegSelector({ value, onChange }: { value: Leg; onChange: (l: Leg) => void }) {
  const opts: { leg: Leg; label: string }[] = [
    { leg: 'both', label: 'Ida/Volta' },
    { leg: 'go', label: 'Só ida' },
    { leg: 'back', label: 'Só volta' },
    { leg: 'none', label: 'Não vai' },
  ];
  return (
    <View style={styles.legRow}>
      {opts.map((o) => {
        const active = value === o.leg;
        const c = legColor(o.leg);
        return (
          <TouchableOpacity
            key={o.leg}
            style={[styles.legBtn, active && { backgroundColor: c.bg, borderColor: c.text }]}
            onPress={() => onChange(o.leg)}
          >
            <Text style={[styles.legBtnText, active && { color: c.text }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
export function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <View style={[styles.metricCard, accent && { backgroundColor: Colors.greenLight }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && { color: Colors.green }]}>{value}</Text>
      {sub && <Text style={styles.metricSub}>{sub}</Text>}
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────
export function PrimaryButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, style]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <TouchableOpacity style={[styles.secondaryBtn, style]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.green,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  legRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  legBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  legBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metricSub: {
    fontSize: 10,
    color: Colors.textHint,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textHint,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.green,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: 11,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
});
