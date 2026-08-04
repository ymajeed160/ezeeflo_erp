/**
 * Attendance History Screen
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Spacing, BorderRadius } from '../../theme';

const AttendanceHistoryScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const dummyRecords = [
    { date: '2026-08-04', checkIn: '08:55', checkOut: '17:05', status: 'present', hours: 8.17 },
    { date: '2026-08-03', checkIn: '09:02', checkOut: '17:00', status: 'late', hours: 7.97 },
    { date: '2026-08-02', checkIn: '08:50', checkOut: '17:10', status: 'present', hours: 8.33 },
    { date: '2026-08-01', checkIn: '08:45', checkOut: '17:00', status: 'present', hours: 8.25 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Attendance History</Text>
        {dummyRecords.map((r, i) => (
          <Surface key={i} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: getStatusColor(r.status) }]} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>{r.date}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                  {r.checkIn} - {r.checkOut} · {r.hours}h
                </Text>
              </View>
              <Text variant="labelSmall" style={{ color: getStatusColor(r.status), textTransform: 'uppercase' }}>{r.status}</Text>
            </View>
          </Surface>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  title: { fontWeight: '700', marginBottom: Spacing.xl },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
});

export default AttendanceHistoryScreen;
