/**
 * Dashboard Screen
 * Elegant employee dashboard with layered gradient header, glassmorphism cards,
 * circular progress indicators, and refined typography.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  useTheme,
  Surface,
  Avatar,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DashboardAPI from '../../api/dashboardApi';
import AttendanceAPI from '../../api/attendanceApi';
import LeaveAPI from '../../api/leaveApi';
import EmployeeAPI from '../../api/employeeApi';
import PayrollAPI from '../../api/payrollApi';
import { Spacing, BorderRadius } from '../../theme';
import type { DashboardData, TodayAttendance, LeaveBalance, Holiday, Payslip } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Helpers ──

const safeDate = (d: string | undefined): { day: number; mon: string; full: string } | null => {
  if (!d) return null;
  // Try parsing ISO / YYYY-MM-DD format directly
  let t = new Date(d);
  if (isNaN(t.getTime())) {
    // Try appending current year for MM-DD format (recurring holidays)
    const parts = d.split(/[-\/]/);
    if (parts.length === 2) {
      const year = new Date().getFullYear();
      t = new Date(`${year}-${parts[0]}-${parts[1]}`);
    }
  }
  if (isNaN(t.getTime())) return null;
  return {
    day: t.getDate(),
    mon: t.toLocaleString('en-US', { month: 'short' }),
    full: t.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
};

const getElapsed = (timeStr?: string): string => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const checkIn = new Date();
  checkIn.setHours(h || 0, m || 0, 0, 0);
  const now = new Date();
  const diffMs = now.getTime() - checkIn.getTime();
  if (diffMs < 0) return 'Just now';
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

/**
 * Circular progress SVG ring component (pure RN View-based approximation).
 * Renders a donut ring showing used vs remaining.
 */
const CircularProgress: React.FC<{ used: number; total: number; color: string; size?: number; stroke?: number }> = ({
  used, total, color, size = 56, stroke = 5,
}) => {
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);

  // We can't use react-native-svg unless installed, so we render a visual progress
  // using two overlapping half-circles with rotation. This is a pure-RN approach.
  const bgColor = color + '20';
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Background ring */}
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: bgColor, position: 'absolute',
      }} />
      {/* Foreground arcs rendered via border technique */}
      <View style={{
        width: size, height: size, position: 'absolute',
        transform: [{ rotate: '-90deg' }],
      }}>
        {/* Half 1 */}
        <View style={{
          width: size / 2, height: size, overflow: 'hidden', position: 'absolute', left: 0,
        }}>
          <View style={{
            width: size, height: size, borderRadius: size / 2,
            borderWidth: stroke, borderColor: pct > 0 ? color : 'transparent',
            position: 'absolute', left: 0,
          }} />
        </View>
        {/* Half 2 */}
        <View style={{
          width: size / 2, height: size, overflow: 'hidden', position: 'absolute', right: 0,
        }}>
          <View style={{
            width: size, height: size, borderRadius: size / 2,
            borderWidth: stroke, borderColor: pct > 0.5 ? color : 'transparent',
            position: 'absolute', right: 0,
            transform: [{ rotate: `${Math.min(pct * 360, 180)}deg` }],
          }} />
        </View>
      </View>
      {/* Center */}
      <View style={{
        width: size - stroke * 2, height: size - stroke * 2, borderRadius: (size - stroke * 2) / 2,
        backgroundColor: 'transparent',
        position: 'absolute', top: stroke, left: stroke,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={{ fontSize: size * 0.28, fontWeight: '800', color }}>{used}</Text>
      </View>
    </View>
  );
};

// ── Component ──

const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, activeCompany, logout } = useAuth();

  const [dash, setDash] = useState<DashboardData | null>(null);
  const [todayAtt, setTodayAtt] = useState<TodayAttendance | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [lastPayslip, setLastPayslip] = useState<Payslip | null>(null);

  // Live clock — re-render every minute
  useEffect(() => {
    if (!todayAtt?.isCheckedIn || todayAtt.isCheckedOut) return;
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, [todayAtt?.isCheckedIn, todayAtt?.isCheckedOut]);

  const fetchAll = useCallback(async () => {
    try {
      const empRes = await EmployeeAPI.getMyProfile();
      const employeeId = empRes.success && empRes.data ? empRes.data.id : undefined;

      const [dr, ar, lr, hr] = await Promise.all([
        DashboardAPI.getSummary(),
        AttendanceAPI.getTodaySummary(employeeId),
        LeaveAPI.getBalances(employeeId),
        DashboardAPI.getUpcomingHolidays(5),
      ]);
      if (dr.success && dr.data) setDash(dr.data);
      if (ar.success && ar.data) setTodayAtt(ar.data);
      if (lr.success && lr.data) setBalances(lr.data);
      if (hr.success && hr.data) setHolidays(hr.data);

      try {
        const pr = await PayrollAPI.getPayslips({ limit: 1 });
        if (pr.success && pr.data && pr.data.length > 0) setLastPayslip(pr.data[0]);
      } catch (_) { /* optional */ }
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  // Re-fetch on initial mount + every time tab gains focus
  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchAll(); setRefreshing(false);
  }, [fetchAll]);

  const actions = [
    { i: 'login', l: 'Check In', c: '#10b981', g: ['#10b981', '#34d399'], r: 'Attendance' },
    { i: 'calendar-plus', l: 'Apply Leave', c: '#6366f1', g: ['#6366f1', '#a78bfa'], r: 'Leave' },
    { i: 'file-document-outline', l: 'Payslips', c: '#f59e0b', g: ['#f59e0b', '#fbbf24'], r: 'Payroll' },
    { i: 'account-group', l: 'Directory', c: '#06b6d4', g: ['#06b6d4', '#22d3ee'], r: 'More', p: { screen: 'CompanyDirectory' } },
  ];

  // ── Loading State ──
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: Spacing.lg }}>Loading your dashboard...</Text>
      </View>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const isCheckedIn = todayAtt?.isCheckedIn && !todayAtt?.isCheckedOut;
  const isComplete = todayAtt?.isCheckedIn && todayAtt?.isCheckedOut;
  const hasNotCheckedIn = !todayAtt?.isCheckedIn;

  // Status colors
  const statusColor = isCheckedIn ? '#10b981' : isComplete ? '#6366f1' : '#f59e0b';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        {/* Decorative elements */}
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <View style={styles.headerDecor3} />

        {/* Top row: user info + avatar */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>👋 Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.firstName} {user?.lastName}
            </Text>
            <View style={styles.metaRow}>
              {activeCompany && (
                <View style={styles.metaBadge}>
                  <Icon name="office-building" size={11} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.metaText} numberOfLines={1}>{activeCompany.name}</Text>
                </View>
              )}
              {dash?.employee?.employeeCode && (
                <View style={styles.metaBadge}>
                  <Icon name="card-account-details-outline" size={11} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.metaText}>{dash.employee.employeeCode}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Icon name="logout" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'Profile' })}>
              <Avatar.Text
                size={46}
                label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                style={styles.avatar}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.dateText}>{todayStr}</Text>
      </View>

      {/* ═══════════════════ CONTENT ═══════════════════ */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Attendance Status Card ── */}
        <Surface style={[styles.card, styles.attendanceCard]}>
          <View style={styles.attendanceRow}>
            {/* Status indicator with pulse dot */}
            <View style={[styles.statusIconWrap, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDotOuter, { borderColor: statusColor + '30' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              </View>
              <Icon
                name={isCheckedIn ? 'clock-time-eight-outline' : isComplete ? 'check-circle' : 'clock-alert-outline'}
                size={30}
                color={statusColor}
              />
            </View>

            <View style={styles.attendanceInfo}>
              <Text style={[styles.attendanceTitle, { color: theme.colors.onSurface }]}>
                {isCheckedIn ? 'You are checked in' : isComplete ? 'Day complete ✓' : 'Not checked in yet'}
              </Text>
              {isCheckedIn && (
                <>
                  <Text style={[styles.attendanceSub, { color: theme.colors.outline }]}>
                    Checked in at {todayAtt!.checkInTime || '--:--'}
                  </Text>
                  <View style={styles.elapsedRow}>
                    <View style={[styles.elapsedDot, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.elapsedText}>
                      {getElapsed(todayAtt!.checkInTime)} elapsed
                    </Text>
                  </View>
                </>
              )}
              {isComplete && todayAtt?.checkOutTime && (
                <Text style={[styles.attendanceSub, { color: theme.colors.outline }]}>
                  {todayAtt.checkInTime || '--:--'} – {todayAtt.checkOutTime}
                </Text>
              )}
              {hasNotCheckedIn && (
                <Text style={[styles.attendanceSub, { color: theme.colors.outline }]}>
                  Tap to mark your attendance
                </Text>
              )}
              {todayAtt?.shift && (
                <View style={styles.shiftBadge}>
                  <Icon name="clock-outline" size={12} color={theme.colors.primary} />
                  <Text style={[styles.shiftText, { color: theme.colors.primary }]}>
                    {todayAtt.shift.name} · {todayAtt.shift.startTime} – {todayAtt.shift.endTime}
                  </Text>
                </View>
              )}
            </View>

            <Button
              mode="contained"
              compact
              onPress={() => navigation.navigate('Attendance')}
              style={[styles.actionBtn, { backgroundColor: statusColor }]}
              labelStyle={styles.actionBtnLabel}
            >
              {isCheckedIn ? 'View' : 'Check In'}
            </Button>
          </View>
        </Surface>

        {/* ── Quick Actions ── */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {actions.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickItem, { backgroundColor: theme.colors.surface }]}
              activeOpacity={0.75}
              onPress={() => a.p ? navigation.navigate(a.r, a.p) : navigation.navigate(a.r)}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: a.c + '14' }]}>
                <Icon name={a.i} size={24} color={a.c} />
              </View>
              <Text style={[styles.quickLabel, { color: theme.colors.onSurface }]}>{a.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Leave Balances ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Leave Balances</Text>
          {balances.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Leave')}>
              <Text style={[styles.seeAll, { color: theme.colors.primary }]}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {balances.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leaveScroll}>
            {balances.map((b: any) => {
              const total = (Number(b.openingBalance) || 0) + (Number(b.accruedDays) || 0);
              const used = Number(b.usedDays) || 0;
              const rem = Number(b.availableBalance) ?? (total - used);
              const pct = total > 0 ? used / total : 0;
              const barColor = pct > 0.8 ? '#ef4444' : pct > 0.5 ? '#f59e0b' : '#10b981';

              return (
                <Surface key={b.id} style={[styles.leaveCard, { backgroundColor: theme.colors.surface }]}>
                  <CircularProgress used={used} total={total} color={barColor} size={60} stroke={6} />
                  <Text style={[styles.leaveDaysLeft, { color: barColor }]}>{rem}</Text>
                  <Text style={[styles.leaveDaysLabel, { color: theme.colors.outline }]}>days left</Text>
                  <Text style={[styles.leaveTypeName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {b.leaveType?.name || 'Leave'}
                  </Text>
                  <View style={styles.leaveBar}>
                    <View style={[styles.leaveBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[styles.leaveUsedText, { color: theme.colors.outline }]}>
                    {used} of {total} used
                  </Text>
                </Surface>
              );
            })}
          </ScrollView>
        ) : (
          <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="calendar-blank" size={32} color={theme.colors.outline} />
            <Text style={[styles.emptyText, { color: theme.colors.outline }]}>No leave balances yet</Text>
          </Surface>
        )}

        {/* ── Upcoming Holidays ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Upcoming Holidays</Text>
        </View>
        {holidays.length > 0 ? (
          <Surface style={[styles.card, styles.holidayCardWrap]}>
            {holidays.slice(0, 3).map((h, idx) => {
              const sd = safeDate(h.date);
              // For recurring holidays without a full date, show a calendar icon
              const hasValidDate = sd !== null;
              return (
                <TouchableOpacity
                  key={h.id}
                  activeOpacity={0.6}
                  onPress={() => navigation.navigate('More', { screen: 'Notifications' })}
                >
                  <View style={[styles.holidayRow, idx < Math.min(holidays.length, 3) - 1 && styles.holidayBorder]}>
                    <View style={[styles.holidayDateBox, { backgroundColor: hasValidDate ? theme.colors.secondaryContainer : theme.colors.primaryContainer }]}>
                      {hasValidDate ? (
                        <>
                          <Text style={[styles.holidayDay, { color: theme.colors.secondary }]}>{sd!.day}</Text>
                          <Text style={[styles.holidayMon, { color: theme.colors.secondary }]}>{sd!.mon}</Text>
                        </>
                      ) : (
                        <Icon name="calendar-star" size={24} color={theme.colors.primary} />
                      )}
                    </View>
                    <View style={styles.holidayInfo}>
                      <Text style={[styles.holidayName, { color: theme.colors.onSurface }]}>{h.name}</Text>
                      {hasValidDate && <Text style={[styles.holidayFullDate, { color: theme.colors.outline }]}>{sd!.full}</Text>}
                      {h.isRecurring && (
                        <Text style={[styles.holidayRecurring, { color: theme.colors.primary }]}>Recurring yearly</Text>
                      )}
                      {h.description && (
                        <Text style={[styles.holidayDesc, { color: theme.colors.outline }]} numberOfLines={1}>
                          {h.description}
                        </Text>
                      )}
                    </View>
                    <Button
                      mode="text"
                      compact
                      onPress={() => navigation.navigate('More', { screen: 'Notifications' })}
                      textColor={theme.colors.primary}
                      style={{ marginLeft: Spacing.xs }}
                    >
                      View
                    </Button>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Surface>
        ) : (
          <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="beach" size={32} color={theme.colors.outline} />
            <Text style={[styles.emptyText, { color: theme.colors.outline }]}>No upcoming holidays</Text>
          </Surface>
        )}

        {/* ── Payroll Status ── */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Payroll Status</Text>
        <Surface style={[styles.card, styles.payrollCard]}>
          <View style={styles.payrollRow}>
            <View style={[styles.payrollIconWrap, { backgroundColor: '#f59e0b14' }]}>
              <Icon name="cash-multiple" size={26} color="#f59e0b" />
            </View>
            <View style={styles.payrollInfo}>
              {lastPayslip ? (
                <>
                  <Text style={[styles.payrollTitle, { color: theme.colors.onSurface }]}>
                    {lastPayslip.payslipNumber || 'Latest Payslip'}
                  </Text>
                  <Text style={[styles.payrollPeriod, { color: theme.colors.outline }]}>
                    {lastPayslip.periodStart} – {lastPayslip.periodEnd}
                  </Text>
                  {lastPayslip.netSalary !== undefined && (
                    <Text style={[styles.payrollAmount, { color: '#10b981' }]}>
                      {lastPayslip.netSalary.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.payrollTitle, { color: theme.colors.onSurface }]}>No payslips yet</Text>
                  <Text style={[styles.payrollPeriod, { color: theme.colors.outline }]}>
                    Your payslip will appear here after payroll processing
                  </Text>
                </>
              )}
            </View>
            <Button mode="text" compact onPress={() => navigation.navigate('Payroll')} textColor={theme.colors.primary}>
              View
            </Button>
          </View>
        </Surface>

        <View style={{ height: Spacing.xxxl + 16 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ──

const styles = StyleSheet.create({
  // Layout
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },

  // ── Header ──
  header: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', top: -40, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerDecor2: {
    position: 'absolute', top: 60, left: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerDecor3: {
    position: 'absolute', bottom: -10, right: 50,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(99,102,241,0.3)',
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerLeft: { flex: 1, marginRight: Spacing.md },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500', letterSpacing: 0.3 },
  userName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2, letterSpacing: 0.2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
  },
  metaText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600', maxWidth: 130 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutBtn: { padding: 4 },
  avatar: { backgroundColor: 'rgba(255,255,255,0.18)' },
  dateText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 14, fontWeight: '500', letterSpacing: 0.2 },

  // ── Card Base ──
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  // ── Attendance Card ──
  attendanceCard: { padding: Spacing.lg },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  statusDotOuter: {
    position: 'absolute', width: 54, height: 54, borderRadius: 27,
    borderWidth: 2,
  },
  statusDot: {
    position: 'absolute', top: -2, right: -2,
    width: 10, height: 10, borderRadius: 5,
  },
  attendanceInfo: { flex: 1 },
  attendanceTitle: { fontWeight: '700', fontSize: 15 },
  attendanceSub: { fontSize: 12, marginTop: 3 },
  elapsedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 6 },
  elapsedDot: { width: 7, height: 7, borderRadius: 4 },
  elapsedText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  shiftBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, backgroundColor: '#3b82f610', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start',
  },
  shiftText: { fontSize: 11, fontWeight: '600' },
  actionBtn: { borderRadius: 22, elevation: 0 },
  actionBtnLabel: { fontSize: 13, fontWeight: '700' },

  // ── Section Titles ──
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontWeight: '700', fontSize: 16, marginBottom: Spacing.md, letterSpacing: 0.2 },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // ── Quick Actions ──
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  quickItem: {
    flex: 1, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg, alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  quickIconWrap: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  quickLabel: { textAlign: 'center', fontWeight: '600', fontSize: 11 },

  // ── Leave Balances ──
  leaveScroll: { marginBottom: Spacing.xl },
  leaveCard: {
    borderRadius: BorderRadius.xl, padding: Spacing.lg,
    marginRight: Spacing.md, width: 155, alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  leaveDaysLeft: { fontWeight: '800', fontSize: 26, marginTop: 8 },
  leaveDaysLabel: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  leaveTypeName: { fontWeight: '700', fontSize: 13, marginTop: 6, textAlign: 'center' },
  leaveBar: {
    height: 4, backgroundColor: '#e5e7eb', borderRadius: 2,
    marginVertical: 8, width: '100%', overflow: 'hidden',
  },
  leaveBarFill: { height: '100%', borderRadius: 2 },
  leaveUsedText: { fontSize: 10, fontWeight: '500' },

  // ── Holidays ──
  holidayCardWrap: { padding: Spacing.sm, paddingHorizontal: Spacing.md },
  holidayRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  holidayBorder: {
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  holidayDateBox: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  holidayDay: { fontSize: 18, fontWeight: '800' },
  holidayMon: { fontSize: 10, fontWeight: '700', marginTop: -2 },
  holidayInfo: { flex: 1, marginRight: Spacing.sm },
  holidayName: { fontWeight: '600', fontSize: 14 },
  holidayFullDate: { fontSize: 12, marginTop: 2 },
  holidayRecurring: { fontSize: 11, marginTop: 1, fontWeight: '600' },
  holidayDesc: { fontSize: 11, marginTop: 1 },

  // ── Payroll ──
  payrollCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  payrollRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  payrollIconWrap: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  payrollInfo: { flex: 1 },
  payrollTitle: { fontWeight: '700', fontSize: 14 },
  payrollPeriod: { fontSize: 12, marginTop: 2 },
  payrollAmount: { fontWeight: '800', fontSize: 16, marginTop: 4 },

  // ── Empty State ──
  emptyCard: {
    borderRadius: BorderRadius.xl, padding: Spacing.xxl,
    alignItems: 'center', marginBottom: Spacing.xl,
    elevation: 1,
  },
  emptyText: { fontSize: 13, marginTop: 10, fontWeight: '500' },
});

export default DashboardScreen;
