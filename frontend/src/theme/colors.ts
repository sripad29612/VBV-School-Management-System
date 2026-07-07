export const colors = {
  primary: '#2563EB', // Royal Blue
  secondary: '#F97316', // Orange
  success: '#10B981', // Emerald Green
  danger: '#EF4444', // Rose Red
  warning: '#F59E0B', // Amber
  info: '#06B6D4', // Cyan
  
  light: {
    background: '#F5F7FB', // Light blue-gray bg
    surface: '#FFFFFF',
    text: '#1E293B', // Dark slate text
    textSecondary: '#64748B', // Medium slate text
    border: '#E2E8F0',
    cardShadow: 'rgba(37, 99, 235, 0.06)',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
  }
};

export type ThemeColors = typeof colors.light;

