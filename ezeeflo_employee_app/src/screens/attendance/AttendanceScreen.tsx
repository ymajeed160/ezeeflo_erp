/**
 * Attendance Screen
 * 
 * Employee attendance with:
 * - Check-In / Check-Out / Break
 * - GPS location capture
 * - Today's attendance summary
 * - Quick access to history & calendar
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  Button,
  Surface,
  ActivityIndicator,
  Snackbar,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AttendanceAPI from '../../api/attendanceApi';
import EmployeeAPI from '../../api/employeeApi';
import LocationService from '../../services/LocationService';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { Spacing, BorderRadius } from '../../theme';
import type { TodayAttendance, GeoLocation, Employee } from '../../types';
import Config from '../../config';

const AttendanceScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, activeCompany } = useAuth();
  const { addOfflineRecord, unsyncedCount } = useOfflineSync();

  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [snackMsg, setSnackMsg] = useState('');
  const [showSnack, setShowSnack] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  // ── Fetch Today's Attendance ──
  const fetchToday = useCallback(async () => {
    try {
      // Fetch employee first, then use employeeId for attendance
      const empRes = await EmployeeAPI.getMyProfile();
      if (empRes.success && empRes.data) setEmployee(empRes.data);
      const employeeId = empRes.success && empRes.data ? empRes.data.id : undefined;

      const res = await AttendanceAPI.getTodaySummary(employeeId);
      if (res.success && res.data) setToday(res.data);

      const hasPerm = await LocationService.hasPermissions();
      setLocationPermission(hasPerm);
    } catch (error) {
      console.warn('Attendance fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchToday();
    setRefreshing(false);
  }, [fetchToday]);

  // ── Get GPS Location ──
  const getLocation = useCallback(async (): Promise<GeoLocation | null> => {
    if (!locationPermission) {
      const granted = await LocationService.requestPermissions();
      setLocationPermission(granted);
      if (!granted) {
        Alert.alert(
          'Location Required',
          'Location access is needed for attendance verification. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        return null;
      }
    }
    const loc = await LocationService.getCurrentPosition();
    if (loc) setCurrentLocation(loc);

    // Validate against geofence if location available
    if (loc) {
      try {
        const validation = await AttendanceAPI.validateLocation(loc);
        if (validation.data && !validation.data.isValid) {
          Alert.alert(
            'Location Warning',
            `You appear to be outside the office area (${Math.round(validation.data.distance || 0)}m away). Mark attendance anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue', onPress: () => {} },
            ]
          );
        }
      } catch {}
    }

    return loc;
  }, [locationPermission]);

  // ── Attendance Actions ──
  const handleAttendanceAction = useCallback(
    async (action: 'check_in' | 'check_out' | 'break_start' | 'break_end') => {
      setActionLoading(true);
      try {
        let location: GeoLocation | null = null;
        if (Config.FEATURES.GPS_ATTENDANCE && action !== 'break_end') {
          location = await getLocation();
        }

        // Build the correct payload for the backend
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const nowISO = now.toISOString(); // Full ISO datetime
        const employeeId = employee?.id; // Employee record ID, not user ID

        if (!employeeId) {
          Alert.alert('Error', 'Unable to identify your employee record. Please contact HR.');
          return;
        }

        try {
          let payload: any = {
            employeeId,
            attendanceDate: todayStr,
            method: location ? 'GPS' : 'Mobile',
            remarks: action === 'break_start' ? 'Break started' : action === 'break_end' ? 'Break ended' : undefined,
          };

          if (action === 'check_in') {
            payload.checkInTime = nowISO;
          } else if (action === 'check_out') {
            payload.checkOutTime = nowISO;
          } else if (action === 'break_start') {
            // Breaks are not supported as separate records in current backend
            // Mark as remarks on check-in record
            payload.checkInTime = nowISO;
            payload.remarks = 'Break started';
          } else if (action === 'break_end') {
            payload.checkOutTime = nowISO;
            payload.remarks = 'Break ended';
          }

          const res = await AttendanceAPI.mark(payload);
          if (res.success) {
            setSnackMsg(getActionMessage(action));
            setShowSnack(true);
            await fetchToday();
            // Navigate back to dashboard after a brief delay so user sees the success
            setTimeout(() => {
              navigation.navigate('Dashboard');
            }, 1200);
          }
        } catch (apiError: any) {
          // If offline, save locally
          if (apiError.isNetworkError && Config.FEATURES.OFFLINE_ATTENDANCE) {
            if (activeCompany && user) {
              await addOfflineRecord({
                employeeId: user.id,
                companyId: activeCompany.id,
                action,
                location: location || undefined,
              });
              setSnackMsg(`${getActionMessage(action)} (saved offline)`);
              setShowSnack(true);
            }
          } else {
            throw apiError;
          }
        }
      } catch (error: any) {
        setSnackMsg(error.message || 'Failed to record attendance');
        setShowSnack(true);
      } finally {
        setActionLoading(false);
      }
    },
    [getLocation, fetchToday, addOfflineRecord, activeCompany, user]
  );

  const getActionMessage = (action: string): string => {
    switch (action) {
      case 'check_in': return 'Checked in successfully!';
      case 'check_out': return 'Checked out successfully!';
      case 'break_start': return 'Break started!';
      case 'break_end': return 'Break ended!';
      default: return 'Attendance recorded';
    }
  };

  // ── Get action button ──
  const getActionButton = () => {
    if (!today) return null;

    if (!today.isCheckedIn) {
      return (
        <Button
          mode="contained"
          onPress={() => handleAttendanceAction('check_in')}
          loading={actionLoading}
          disabled={actionLoading}
          style={[styles.mainActionBtn, { backgroundColor: '#10b981' }]}
          contentStyle={styles.actionBtnContent}
          icon="login"
        >
          Check In
        </Button>
      );
    }

    if (today.isOnBreak) {
      return (
        <Button
          mode="contained"
          onPress={() => handleAttendanceAction('break_end')}
          loading={actionLoading}
          disabled={actionLoading}
          style={[styles.mainActionBtn, { backgroundColor: '#f59e0b' }]}
          contentStyle={styles.actionBtnContent}
          icon="coffee-off"
        >
          End Break
        </Button>
      );
    }

    if (!today.isCheckedOut) {
      return (
        <View style={styles.actionGroup}>
          <Button
            mode="contained"
            onPress={() => handleAttendanceAction('check_out')}
            loading={actionLoading}
            disabled={actionLoading}
            style={[styles.mainActionBtn, { backgroundColor: '#ef4444' }]}
            contentStyle={styles.actionBtnContent}
            icon="logout"
          >
            Check Out
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleAttendanceAction('break_start')}
            loading={actionLoading}
            disabled={actionLoading}
            style={styles.secondaryAction}
            icon="coffee"
          >
            Take Break
          </Button>
        </View>
      );
    }

    return (
      <Surface style={[styles.completedCard, { backgroundColor: theme.colors.surface }]}>
        <Icon name="check-circle" size={48} color="#10b981" />
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginTop: Spacing.sm }}>
          Day Complete!
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
          Checked out at {today.checkOutTime || '--:--'}
        </Text>
        {today.record?.totalHours && (
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            Total: {today.record.totalHours} hours
          </Text>
        )}
      </Surface>
    );
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('Dashboard')}
              activeOpacity={0.7}
            >
              <Icon name="arrow-left" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
                Attendance
              </Text>
            </View>
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.outline, paddingLeft: 0 }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Offline indicator */}
        {unsyncedCount > 0 && (
          <Surface style={[styles.offlineBanner, { backgroundColor: '#fef3c7' }]}>
            <Icon name="cloud-sync-outline" size={16} color="#92400e" />
            <Text style={{ color: '#92400e', marginLeft: Spacing.sm, flex: 1 }}>
              {unsyncedCount} offline record(s) pending sync
            </Text>
          </Surface>
        )}

        {/* Shift Info */}
        {today?.shift && (
          <Surface style={[styles.shiftCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.shiftRow}>
              <Icon name="clock-outline" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: Spacing.sm }}>
                Shift: {today.shift.name}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {today.shift.startTime} - {today.shift.endTime}
              {today.shift.isFlexible ? ' (Flexible)' : ''}
            </Text>
          </Surface>
        )}

        {/* Main Action */}
        <View style={styles.mainAction}>{getActionButton()}</View>

        {/* Location */}
        {currentLocation && (
          <Surface style={[styles.locationCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.locationRow}>
              <Icon name="map-marker" size={16} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurface, marginLeft: Spacing.sm, flex: 1 }}>
                {currentLocation.address || `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}
              </Text>
            </View>
            {currentLocation.accuracy && (
              <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                Accuracy: {Math.round(currentLocation.accuracy)}m
              </Text>
            )}
          </Surface>
        )}

        <Divider style={{ marginVertical: Spacing.xl }} />

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('AttendanceHistory')}
          >
            <Icon name="history" size={24} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: Spacing.xs }}>
              History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('AttendanceCalendar')}
          >
            <Icon name="calendar-month" size={24} color={theme.colors.secondary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: Spacing.xs }}>
              Calendar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Snackbar
        visible={showSnack}
        onDismiss={() => setShowSnack(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.success }}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.xl },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  title: { fontWeight: '700', marginBottom: 4 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  shiftCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    elevation: 1,
  },
  shiftRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  mainAction: { marginBottom: Spacing.xl },
  mainActionBtn: { borderRadius: BorderRadius.lg },
  actionBtnContent: { paddingVertical: 8 },
  actionGroup: { gap: Spacing.md },
  secondaryAction: { borderRadius: BorderRadius.lg },
  completedCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    elevation: 1,
  },
  locationCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  quickLinks: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickLink: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    elevation: 1,
  },
});

export default AttendanceScreen;
