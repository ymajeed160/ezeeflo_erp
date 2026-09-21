/**
 * Approvals Screen (Manager Feature)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Spacing, BorderRadius } from '../../theme';
import ApprovalsAPI from '../../api/approvalsApi';
import type { PendingApproval } from '../../types';

const getApprovalIcon = (type: string) => {
  const map: Record<string, string> = { leave: 'calendar-account', attendance_correction: 'clock-edit', document_request: 'file-sign', training: 'school', overtime: 'clock-plus', expense: 'cash' };
  return map[type] || 'clipboard-check';
};

const ApprovalsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await ApprovalsAPI.getPending({ limit: 20 });
      if (res.success && res.data) setApprovals(res.data as PendingApproval[]);
    } catch (e) { console.warn('Approvals fetch error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchData(); setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Pending Approvals</Text>
        {approvals.map((approval) => (
          <Surface key={approval.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.row}>
              <Icon name={getApprovalIcon(approval.type || '')} size={24} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>{approval.title || 'Request'}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                  {approval.employeeName || ''}{approval.description ? ` · ${approval.description}` : ''}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.outline }}>{approval.requestDate || ''}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Button mode="contained" style={{ backgroundColor: '#10b981', flex: 1 }} labelStyle={{ fontSize: 12 }}>Approve</Button>
              <Button mode="outlined" style={{ flex: 1, borderColor: '#ef4444' }} labelStyle={{ fontSize: 12, color: '#ef4444' }}>Reject</Button>
            </View>
          </Surface>
        ))}
        {approvals.length === 0 && (
          <Surface style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
            <Icon name="check-circle-outline" size={40} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: Spacing.sm }}>No pending approvals</Text>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }, scroll: { padding: Spacing.xl },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: Spacing.xl },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  empty: { borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: 'center' },
});

export default ApprovalsScreen;
