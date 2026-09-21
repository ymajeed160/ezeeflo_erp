/**
 * Application Theme
 * 
 * Centralized theme configuration for consistent styling across the app.
 * Implements EzeeFlo brand colors with light and dark mode support.
 */

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// ── Brand Colors ──
const brandColors = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#93bbfd',
  secondary: '#6366f1',
  secondaryDark: '#4f46e5',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

// ── Font Configuration ──
const fontConfig = {
  fontFamily: 'System',
};

// ── Light Theme ──
export const LightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    primaryContainer: '#dbeafe',
    onPrimaryContainer: '#1e3a5f',
    secondary: brandColors.secondary,
    secondaryContainer: '#e0e7ff',
    onSecondaryContainer: '#312e81',
    tertiary: brandColors.accent,
    tertiaryContainer: '#fef3c7',
    error: brandColors.error,
    errorContainer: '#fee2e2',
    success: brandColors.success,
    successContainer: '#d1fae5',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
    outline: '#cbd5e1',
    outlineVariant: '#e2e8f0',
    elevation: {
      level0: 'transparent',
      level1: '#ffffff',
      level2: '#f8fafc',
      level3: '#f1f5f9',
      level4: '#e2e8f0',
      level5: '#cbd5e1',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
};

// ── Dark Theme ──
export const DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brandColors.primaryLight,
    primaryContainer: '#1e3a5f',
    onPrimaryContainer: '#dbeafe',
    secondary: '#a5b4fc',
    secondaryContainer: '#312e81',
    onSecondaryContainer: '#e0e7ff',
    tertiary: '#fbbf24',
    tertiaryContainer: '#78350f',
    error: '#f87171',
    errorContainer: '#7f1d1d',
    success: '#34d399',
    successContainer: '#064e3b',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    outline: '#475569',
    outlineVariant: '#334155',
    elevation: {
      level0: 'transparent',
      level1: '#1e293b',
      level2: '#273548',
      level3: '#334155',
      level4: '#3b4f6b',
      level5: '#475569',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
};

// ── Spacing ──
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ── Border Radius ──
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 999,
} as const;

// ── Shadows ──
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export default { LightTheme, DarkTheme, Spacing, BorderRadius, Shadows, brandColors };
