/**
 * Leave Screen
 * 
 * Leave management with balances, applications, and quick apply.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LeaveAPI from '../../api/leaveApi';
import EmployeeAPI from '../../api/employeeApi';
import { Spacing, BorderRadius } from '../../theme';
import type { LeaveBalance, LeaveApplication, LeaveType } from '../../types';

const LeaveScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const empRes = await EmployeeAPI.getMyProfile();
      const employeeId = empRes.success && empRes.data ? empRes.data.id : undefined;

      const [balRes, appRes, typeRes] = await Promise.all([
        LeaveAPI.getBalances(employeeId),
        LeaveAPI.getApplications({ limit: 20, employeeId }),
        LeaveAPI.getLeaveTypes(),
      ]);
      if (balRes.success && balRes.data) setBalances(balRes.data);
      if (appRes.success && appRes.data) setApplications(appRes.data as LeaveApplication[]);
      if (typeRes.success && typeRes.data) setLeaveTypes(typeRes.data);
    } catch (error) {
      console.warn('Leave fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getStatusChip = (status: string) => {
    const s = (status || '').toLowerCase();
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: '#f59e0b', label: 'Pending' },
      submitted: { color: '#f59e0b', label: 'Pending' },
      approved: { color: '#10b981', label: 'Approved' },
      rejected: { color: '#ef4444', label: 'Rejected' },
      cancelled: { color: '#6b7280', label: 'Cancelled' },
    };
    const c = config[s] || config.pending;
    return <Chip style={{ backgroundColor: c.color + '15' }} textStyle={{ color: c.color, fontSize: 11 }}>{c.label}</Chip>;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Leave</Text>
          <Button mode="contained" onPress={() => navigation.navigate('ApplyLeave')} icon="plus">
            Apply
          </Button>
        </View>

        {/* Leave Balances */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>My Balances</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.balanceScroll}>
          {balances.map((bal) => (
            <Surface key={bal.id} style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
              <Icon name="calendar-check" size={28} color={theme.colors.primary} />
              <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: '700', marginTop: Spacing.sm }}>
                {bal.availableBalance ?? 0}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.outline }}>days remaining</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: Spacing.xs }}>
                {bal.leaveType?.name || 'Leave'}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                {bal.usedDays ?? 0} used / {(bal.openingBalance ?? 0) + (bal.accruedDays ?? 0)} total
              </Text>
            </Surface>
          ))}
        </ScrollView>

        <Divider style={{ marginVertical: Spacing.xl }} />

        {/* Recent Applications */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Recent Applications</Text>
          <TouchableOpacity onPress={() => navigation.navigate('LeaveCalendar')}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Calendar</Text>
          </TouchableOpacity>
        </View>

        {applications.length === 0 ? (
          <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="calendar-blank" size={40} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: Spacing.sm }}>No leave applications yet</Text>
          </Surface>
        ) : (
          applications.map((app) => (
            <TouchableOpacity key={app.id}>
              <Surface style={[styles.appCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.appRow}>
                  <View style={[styles.appIcon, { backgroundColor: (app.leaveType?.color || theme.colors.primary) + '15' }]}>
                    <Icon name="calendar-account" size={24} color={app.leaveType?.color || theme.colors.primary} />
                  </View>
                  <View style={styles.appInfo}>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      {app.leaveType?.name || 'Leave'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                      {app.startDate} - {app.endDate} ({app.totalDays} days)
                    </Text>
                  </View>
                  {getStatusChip(app.status)}
                </View>
              </Surface>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  title: { fontWeight: '700', flex: 1 },
  sectionTitle: { fontWeight: '700', marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceScroll: { marginBottom: Spacing.lg },
  balanceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    width: 150,
    alignItems: 'center',
    elevation: 1,
  },
  appCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  appRow: { flexDirection: 'row', alignItems: 'center' },
  appIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  appInfo: { flex: 1 },
  emptyCard: { borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: 'center', elevation: 1 },
});

export default LeaveScreen;
