export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  bg: string;
  sidebarBg: string;
  card: string;
  cardElevated: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textSub: string;
  primary: string;
  primaryText: string;
  heroBg: string;
  heroBorder: string;
  heroText: string;
  heroSub: string;
  statGreenBg: string;
  statGreenBorder: string;
  statGreenText: string;
  statAmberBg: string;
  statAmberBorder: string;
  statAmberText: string;
  statBlueBg: string;
  statBlueBorder: string;
  statBlueText: string;
  statRedBg: string;
  statRedBorder: string;
  statRedText: string;
  inputBg: string;
  inputBorder: string;
  badgeBg: string;
  actionBg: string;
  actionHover: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  dark: {
    mode: 'dark',
    bg: '#0F1216',
    sidebarBg: '#171A21',
    card: '#1B1F27',
    cardElevated: '#222732',
    border: '#292F3D',
    borderSubtle: '#222733',
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    textSub: '#64748B',
    primary: '#38BDF8',
    primaryText: '#0F172A',
    heroBg: '#161922',
    heroBorder: '#282F3F',
    heroText: '#FFFFFF',
    heroSub: '#94A3B8',
    statGreenBg: '#112922',
    statGreenBorder: '#1A4D3B',
    statGreenText: '#34D399',
    statAmberBg: '#302213',
    statAmberBorder: '#563B1C',
    statAmberText: '#FBBF24',
    statBlueBg: '#13233A',
    statBlueBorder: '#1F3C64',
    statBlueText: '#60A5FA',
    statRedBg: '#32161A',
    statRedBorder: '#5C222A',
    statRedText: '#F87171',
    inputBg: '#14171F',
    inputBorder: '#2C3342',
    badgeBg: '#222834',
    actionBg: '#232936',
    actionHover: '#2B3242',
  },
  light: {
    mode: 'light',
    bg: '#F3F4F7',
    sidebarBg: '#FFFFFF',
    card: '#FFFFFF',
    cardElevated: '#F9FAFB',
    border: '#E5E7EB',
    borderSubtle: '#F1F3F5',
    text: '#111827',
    textMuted: '#6B7280',
    textSub: '#9CA3AF',
    primary: '#0F172A',
    primaryText: '#FFFFFF',
    heroBg: '#111827',
    heroBorder: '#1F2937',
    heroText: '#FFFFFF',
    heroSub: '#9CA3AF',
    statGreenBg: '#E8F8F0',
    statGreenBorder: '#C4EED8',
    statGreenText: '#059669',
    statAmberBg: '#FEF3EC',
    statAmberBorder: '#FCD9BD',
    statAmberText: '#D97706',
    statBlueBg: '#EFF4FE',
    statBlueBorder: '#D3E1FC',
    statBlueText: '#2563EB',
    statRedBg: '#FEF2F2',
    statRedBorder: '#FECACA',
    statRedText: '#DC2626',
    inputBg: '#F9FAFB',
    inputBorder: '#E5E7EB',
    badgeBg: '#F1F3F7',
    actionBg: '#F3F4F6',
    actionHover: '#E5E7EB',
  },
};

// Legacy fallback
export const theme = {
  background: '#090909',
  card: '#151515',
  border: '#292929',
  pink: '#FF2F92',
  white: '#FFFFFF',
  muted: '#9B9B9B',
  green: '#39D98A',
  amber: '#F5C542',
  red: '#FF6375',
} as const;
