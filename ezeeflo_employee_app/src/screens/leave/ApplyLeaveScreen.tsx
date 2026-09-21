/**
 * Apply Leave Screen
 * 
 * Leave application form with calendar date picker, leave type dropdown,
 * balance display, and reason field.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import {
  Text, useTheme, TextInput, Button, Surface, ActivityIndicator,
  Snackbar, Modal, Portal,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LeaveAPI from '../../api/leaveApi';
import EmployeeAPI from '../../api/employeeApi';
import { Spacing, BorderRadius } from '../../theme';
import type { LeaveType, LeaveBalance } from '../../types';

// ── Helpers ──

const fmtDate = (d: string): string => {
  if (!d) return '';
  const t = new Date(d);
  if (isNaN(t.getTime())) return d;
  return t.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const toISODate = (d: string): string => d; // already ISO format

const todayStr = new Date().toISOString().split('T')[0];

const ApplyLeaveScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [showSnack, setShowSnack] = useState(false);

  // Calendar modal state
  const [calVisible, setCalVisible] = useState(false);
  const [calMode, setCalMode] = useState<'start' | 'end'>('start');
  const [calMarked, setCalMarked] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      try {
        const [typeRes, balRes, empRes] = await Promise.all([
          LeaveAPI.getLeaveTypes(),
          LeaveAPI.getBalances(),
          EmployeeAPI.getMyProfile(),
        ]);
        if (typeRes.data) setLeaveTypes(typeRes.data);
        if (balRes.data) setBalances(balRes.data);
        if (empRes.success && empRes.data) setEmployeeId(empRes.data.id);
      } catch (e) {
        console.warn('Fetch error:', e);
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  // Update calendar marked dates whenever start/end change
  useEffect(() => {
    const marked: Record<string, any> = {};
    if (startDate) {
      marked[startDate] = { selected: true, selectedColor: theme.colors.primary, startingDay: true };
    }
    if (endDate) {
      marked[endDate] = { ...(marked[endDate] || {}), selected: true, selectedColor: theme.colors.primary, endingDay: true };
    }
    // Highlight range
    if (startDate && endDate && startDate < endDate) {
      let d = new Date(startDate);
      const end = new Date(endDate);
      d.setDate(d.getDate() + 1);
      while (d < end) {
        const ds = d.toISOString().split('T')[0];
        marked[ds] = { selected: true, selectedColor: theme.colors.primaryContainer || '#dbeafe', selectedTextColor: theme.colors.primary };
        d.setDate(d.getDate() + 1);
      }
    }
    setCalMarked(marked);
  }, [startDate, endDate, theme.colors.primary, theme.colors.primaryContainer]);

  const openCalendar = (mode: 'start' | 'end') => {
    setCalMode(mode);
    // Close dropdown if open
    if (openDropdown) setOpenDropdown(false);
    setCalVisible(true);
  };

  const onDayPress = (day: { dateString: string }) => {
    const selected = day.dateString;
    if (calMode === 'start') {
      setStartDate(selected);
      // If end date is before new start, clear it
      if (endDate && selected > endDate) setEndDate('');
    } else {
      // If no start date set yet, set both
      if (!startDate) {
        setStartDate(selected);
      }
      setEndDate(selected);
    }
    setCalVisible(false);
  };

  const selectedBalance = balances.find((b) => b.leaveTypeId === selectedType);

  const handleSubmit = async () => {
    if (!selectedType) { Alert.alert('Error', 'Please select a leave type.'); return; }
    if (!startDate || !endDate) { Alert.alert('Error', 'Please select dates.'); return; }
    if (!employeeId) { Alert.alert('Error', 'Unable to identify your employee record. Please try again.'); return; }

    setLoading(true);
    try {
      const res = await LeaveAPI.apply({
        employeeId,
        leaveTypeId: selectedType,
        startDate,
        endDate,
        reason: reason || undefined,
      });
      if (res.success) {
        setSnackMsg('Leave application submitted!');
        setShowSnack(true);
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        Alert.alert('Error', res.message || 'Failed to submit leave.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total days for display
  const totalDays = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1
    : 0;

  if (fetching) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const dropdownItems = leaveTypes.map((lt) => ({ label: lt.name, value: lt.id }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
            Apply for Leave
          </Text>
        </View>

        {/* Leave Type Dropdown */}
        <Text variant="labelMedium" style={[styles.fieldLabel, { color: theme.colors.outline }]}>Leave Type</Text>
        <View style={styles.dropdownWrapper}>
          <DropDownPicker
            open={openDropdown}
            value={selectedType}
            items={dropdownItems}
            setOpen={setOpenDropdown}
            setValue={setSelectedType}
            listMode="SCROLLVIEW"
            style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
            dropDownContainerStyle={{ borderColor: theme.colors.outlineVariant }}
            placeholder="Select leave type"
            zIndex={9999}
            scrollViewProps={{ nestedScrollEnabled: true }}
          />
        </View>
        {selectedBalance && (
          <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: Spacing.xs, fontWeight: '600' }}>
            Available: {selectedBalance.availableBalance} days
          </Text>
        )}

        {/* Date Pickers */}
        <Text variant="labelMedium" style={[styles.fieldLabel, { color: theme.colors.outline }]}>Dates</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateField, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
            onPress={() => openCalendar('start')}
            activeOpacity={0.7}
          >
            <Icon name="calendar-start" size={20} color={startDate ? theme.colors.primary : theme.colors.outline} />
            <Text style={[styles.dateText, { color: startDate ? theme.colors.onSurface : theme.colors.outline }]}>
              {startDate ? fmtDate(startDate) : 'Start Date'}
            </Text>
          </TouchableOpacity>

          <Icon name="arrow-right" size={18} color={theme.colors.outline} style={{ marginHorizontal: 4 }} />

          <TouchableOpacity
            style={[styles.dateField, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
            onPress={() => openCalendar('end')}
            activeOpacity={0.7}
          >
            <Icon name="calendar-end" size={20} color={endDate ? theme.colors.primary : theme.colors.outline} />
            <Text style={[styles.dateText, { color: endDate ? theme.colors.onSurface : theme.colors.outline }]}>
              {endDate ? fmtDate(endDate) : 'End Date'}
            </Text>
          </TouchableOpacity>
        </View>
        {totalDays > 0 && (
          <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: Spacing.xs, fontWeight: '600' }}>
            {totalDays} day{totalDays !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Reason */}
        <TextInput
          label="Reason (optional)"
          value={reason}
          onChangeText={setReason}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        {/* Submit */}
        <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.submitBtn}>
          Submit Application
        </Button>
        <Button mode="text" onPress={() => navigation.goBack()} style={{ marginTop: Spacing.md }}>Cancel</Button>
      </ScrollView>

      {/* Calendar Modal */}
      <Portal>
        <Modal
          visible={calVisible}
          onDismiss={() => setCalVisible(false)}
          contentContainerStyle={[styles.calModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.calHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              {calMode === 'start' ? 'Select Start Date' : 'Select End Date'}
            </Text>
            <TouchableOpacity onPress={() => setCalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.outline} />
            </TouchableOpacity>
          </View>
          <Calendar
            current={calMode === 'start' ? (startDate || todayStr) : (endDate || startDate || todayStr)}
            minDate={calMode === 'end' && startDate ? startDate : todayStr}
            onDayPress={onDayPress}
            markedDates={calMarked}
            markingType="period"
            theme={{
              todayTextColor: theme.colors.primary,
              selectedDayBackgroundColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.onSurface,
              textMonthFontWeight: '700',
              textDayFontWeight: '500',
            }}
          />
        </Modal>
      </Portal>

      <Snackbar visible={showSnack} onDismiss={() => setShowSnack(false)} duration={3000} style={{ backgroundColor: theme.colors.success }}>
        {snackMsg}
      </Snackbar>
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
  fieldLabel: { marginBottom: Spacing.xs, marginTop: Spacing.lg, fontWeight: '600', fontSize: 13 },
  dropdownWrapper: { zIndex: 9999, marginBottom: Spacing.xs },
  dropdown: { marginBottom: 0, zIndex: 9999 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  dateField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  dateText: { fontSize: 14, fontWeight: '500' },
  input: { marginTop: Spacing.lg },
  submitBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.lg },
  calModal: {
    margin: Spacing.xl, borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: 500,
  },
  calHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
});

export default ApplyLeaveScreen;
