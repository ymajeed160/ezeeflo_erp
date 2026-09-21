/**
 * Leave Calendar Screen - Placeholder
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '../../theme';

const LeaveCalendarScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Leave Calendar</Text>
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl },
  title: { fontWeight: '700', marginBottom: Spacing.xl },
});

export default LeaveCalendarScreen;
