/**
 * Payroll Screen
 * 
 * Displays payslips, salary breakdown, and loan info.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, ActivityIndicator, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PayrollAPI from '../../api/payrollApi';
import EmployeeAPI from '../../api/employeeApi';
import { Spacing, BorderRadius } from '../../theme';
import type { Payslip, SalaryBreakdown } from '../../types';

const PayrollScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [salaryBreakdown, setSalaryBreakdown] = useState<SalaryBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const empRes = await EmployeeAPI.getMyProfile();
      const employeeId = empRes.success && empRes.data ? empRes.data.id : undefined;

      const [payslipRes, salaryRes, allowanceRes, deductionRes] = await Promise.all([
        PayrollAPI.getPayslips({ limit: 10, employeeId }),
        PayrollAPI.getSalaryBreakdown(employeeId),
        PayrollAPI.getEmployeeAllowances(employeeId),
        PayrollAPI.getEmployeeDeductions(employeeId),
      ]);
      if (payslipRes.success && payslipRes.data) setPayslips(payslipRes.data as Payslip[]);

      // Build salary breakdown from separate sources
      const salaryData = salaryRes.success && salaryRes.data ? salaryRes.data : null;
      const allowances = allowanceRes.success && allowanceRes.data ? allowanceRes.data : [];
      const deductions = deductionRes.success && deductionRes.data ? deductionRes.data : [];

      if (salaryData) {
        const totalAllowances = Array.isArray(allowances)
          ? allowances.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0)
          : 0;
        const totalDeductions = Array.isArray(deductions)
          ? deductions.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0)
          : 0;

        setSalaryBreakdown({
          basicSalary: Number(salaryData.basicSalary) || 0,
          grossSalary: Number(salaryData.grossSalary) || 0,
          netSalary: (Number(salaryData.basicSalary) || 0) + totalAllowances - totalDeductions,
          allowances: Array.isArray(allowances) ? allowances : [],
          deductions: Array.isArray(deductions) ? deductions : [],
        });
      }
    } catch (error) {
      console.warn('Payroll fetch error:', error);
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
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Payroll</Text>
        </View>

        {/* Salary Breakdown */}
        {salaryBreakdown && (
          <Surface style={[styles.salaryCard, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.salaryLabel}>Net Salary</Text>
            <Text style={styles.salaryAmount}>
              {salaryBreakdown.netSalary?.toLocaleString('en-AE', { style: 'currency', currency: 'AED' }) || 'N/A'}
            </Text>
            <View style={styles.salaryDetails}>
              <View style={styles.salaryDetail}>
                <Text style={styles.salaryDetailLabel}>Basic</Text>
                <Text style={styles.salaryDetailValue}>
                  {salaryBreakdown.basicSalary?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.salaryDetail}>
                <Text style={styles.salaryDetailLabel}>Allowances</Text>
                <Text style={styles.salaryDetailValue}>
                  {salaryBreakdown.allowances?.reduce((s, a) => s + a.amount, 0)?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.salaryDetail}>
                <Text style={styles.salaryDetailLabel}>Deductions</Text>
                <Text style={styles.salaryDetailValue}>
                  {salaryBreakdown.deductions?.reduce((s, d) => s + d.amount, 0)?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>
          </Surface>
        )}

        <Divider style={{ marginVertical: Spacing.xl }} />

        {/* Recent Payslips */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Recent Payslips</Text>

        {payslips.length === 0 ? (
          <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="file-document-outline" size={40} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: Spacing.sm }}>No payslips available</Text>
          </Surface>
        ) : (
          payslips.map((slip) => (
            <TouchableOpacity
              key={slip.id}
              onPress={() => navigation.navigate('PayslipDetail', { payslipId: slip.id })}
            >
              <Surface style={[styles.payslipCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.payslipRow}>
                  <View style={[styles.payslipIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Icon name="file-pdf-box" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.payslipInfo}>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      {slip.payslipNumber || `Payslip #${slip.id.substring(0, 8)}`}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                      {slip.periodStart} - {slip.periodEnd}
                    </Text>
                  </View>
                  <View style={styles.payslipAmount}>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                      {((slip as any).netPay ?? slip.netSalary ?? 0).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={theme.colors.outline} />
                </View>
              </Surface>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  title: { fontWeight: '700' },
  salaryCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  salaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  salaryAmount: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 4, marginBottom: Spacing.lg },
  salaryDetails: { flexDirection: 'row', gap: Spacing.lg },
  salaryDetail: { flex: 1 },
  salaryDetailLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  salaryDetailValue: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontWeight: '700', marginBottom: Spacing.md },
  payslipCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  payslipRow: { flexDirection: 'row', alignItems: 'center' },
  payslipIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  payslipInfo: { flex: 1 },
  payslipAmount: { marginRight: Spacing.sm },
  emptyCard: { borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: 'center', elevation: 1 },
});

export default PayrollScreen;
