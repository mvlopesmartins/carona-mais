// src/utils/theme.ts

export const Colors = {
  green: '#3B6D11',
  greenMid: '#639922',
  greenLight: '#EAF3DE',
  greenDark: '#27500A',

  teal: '#0F6E56',
  tealMid: '#1D9E75',
  tealLight: '#E1F5EE',

  amber: '#854F0B',
  amberMid: '#BA7517',
  amberLight: '#FAEEDA',

  coral: '#993C1D',
  coralMid: '#D85A30',
  coralLight: '#FAECE7',

  purple: '#534AB7',
  purpleLight: '#EEEDFE',

  gray: '#5F5E5A',
  grayMid: '#888780',
  grayLight: '#F1EFE8',

  blue: '#185FA5',
  blueLight: '#E6F1FB',

  white: '#FFFFFF',
  background: '#F4F2EB',
  surface: '#FFFFFF',
  border: '#E0DDD4',
  textPrimary: '#1A1A18',
  textSecondary: '#5F5E5A',
  textHint: '#888780',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const Typography = {
  h1: { fontSize: 22, fontWeight: '600' as const, color: Colors.textPrimary },
  h2: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  h3: { fontSize: 15, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.textPrimary },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, color: Colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  captionBold: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  small: { fontSize: 11, fontWeight: '400' as const, color: Colors.textHint },
  mono: { fontFamily: 'monospace', fontSize: 13, fontWeight: '500' as const },
};

export function legLabel(leg: string): string {
  if (leg === 'both') return 'Ida / Volta';
  if (leg === 'go') return 'Só ida';
  if (leg === 'back') return 'Só volta';
  return 'Não vai';
}

export function legColor(leg: string) {
  if (leg === 'both') return { bg: Colors.greenLight, text: Colors.green };
  if (leg === 'go') return { bg: Colors.tealLight, text: Colors.teal };
  if (leg === 'back') return { bg: Colors.amberLight, text: Colors.amber };
  return { bg: Colors.grayLight, text: Colors.gray };
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export const AVATAR_COLORS = [
  { bg: Colors.greenLight, text: Colors.green },
  { bg: Colors.tealLight, text: Colors.teal },
  { bg: Colors.amberLight, text: Colors.amber },
  { bg: Colors.coralLight, text: Colors.coral },
  { bg: Colors.purpleLight, text: Colors.purple },
  { bg: Colors.blueLight, text: Colors.blue },
];

export function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function fmtCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function fmtDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Mon
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
