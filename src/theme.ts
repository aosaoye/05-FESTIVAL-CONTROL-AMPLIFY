export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  bg: string;
  shellBg: string;
  card: string;
  cardElevated: string;
  cardHover: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textSub: string;
  primary: string;
  primaryText: string;
  accent: string;
  inputBg: string;
  inputBorder: string;
  green: string;
  greenBg: string;
  greenBorder: string;
  amber: string;
  amberBg: string;
  amberBorder: string;
  red: string;
  redBg: string;
  redBorder: string;
  railBg: string;
  railActive: string;
  drawerOverlay: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  dark: {
    mode: 'dark',
    bg: '#080B11',
    shellBg: '#0F141F',
    card: '#151B28',
    cardElevated: '#1B2232',
    cardHover: '#20293C',
    border: '#232B3E',
    borderSubtle: '#1C2333',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textSub: '#64748B',
    primary: '#38BDF8',
    primaryText: '#080B11',
    accent: '#38BDF8',
    inputBg: '#111622',
    inputBorder: '#232B3E',
    green: '#10B981',
    greenBg: 'rgba(16, 185, 129, 0.12)',
    greenBorder: 'rgba(16, 185, 129, 0.28)',
    amber: '#F59E0B',
    amberBg: 'rgba(245, 158, 11, 0.12)',
    amberBorder: 'rgba(245, 158, 11, 0.28)',
    red: '#EF4444',
    redBg: 'rgba(239, 68, 68, 0.12)',
    redBorder: 'rgba(239, 68, 68, 0.28)',
    railBg: '#0D111A',
    railActive: '#1B2232',
    drawerOverlay: 'rgba(0, 0, 0, 0.72)',
  },
  light: {
    mode: 'light',
    bg: '#EDF1F7',
    shellBg: '#FFFFFF',
    card: '#FFFFFF',
    cardElevated: '#F8FAFC',
    cardHover: '#F1F5F9',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#64748B',
    textSub: '#94A3B8',
    primary: '#0F172A',
    primaryText: '#FFFFFF',
    accent: '#2563EB',
    inputBg: '#F8FAFC',
    inputBorder: '#E2E8F0',
    green: '#059669',
    greenBg: '#ECFDF5',
    greenBorder: '#A7F3D0',
    amber: '#D97706',
    amberBg: '#FFFBEB',
    amberBorder: '#FDE68A',
    red: '#DC2626',
    redBg: '#FEF2F2',
    redBorder: '#FECACA',
    railBg: '#F8FAFC',
    railActive: '#E2E8F0',
    drawerOverlay: 'rgba(15, 23, 42, 0.45)',
  },
};
