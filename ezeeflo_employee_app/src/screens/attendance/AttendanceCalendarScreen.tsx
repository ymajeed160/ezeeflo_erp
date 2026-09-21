/**
 * Attendance Calendar Screen
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '../../theme';

const AttendanceCalendarScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Attendance Calendar</Text>
      <Calendar
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.outline,
          selectedDayBackgroundColor: theme.colors.primary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          textDisabledColor: theme.colors.outlineVariant,
        }}
        markedDates={{
          '2026-08-01': { selected: true, selectedColor: '#10b981' },
          '2026-08-02': { selected: true, selectedColor: '#10b981' },
          '2026-08-03': { selected: true, selectedColor: '#f59e0b' },
          '2026-08-04': { selected: true, selectedColor: '#10b981' },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl },
  title: { fontWeight: '700', marginBottom: Spacing.xl },
});

export default AttendanceCalendarScreen;
