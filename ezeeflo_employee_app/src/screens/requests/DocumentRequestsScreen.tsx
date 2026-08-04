/**
 * Document Requests Screen
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RequestsAPI from '../../api/requestsApi';
import { Spacing, BorderRadius } from '../../theme';
import type { DocumentRequest } from '../../types';

const DocumentRequestsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await RequestsAPI.getRequests({ limit: 50 });
        if (res.data) setRequests(res.data as DocumentRequest[]);
      } catch (e) { console.warn(e); } finally { setLoading(false); }
    })();
  }, []);

  const getStatusChip = (status: string) => {
    const c: Record<string, { color: string; label: string }> = {
      pending: { color: '#f59e0b', label: 'Pending' },
      approved: { color: '#3b82f6', label: 'Approved' },
      processing: { color: '#06b6d4', label: 'Processing' },
      completed: { color: '#10b981', label: 'Completed' },
      rejected: { color: '#ef4444', label: 'Rejected' },
    };
    const s = c[status] || c.pending;
    return <Chip style={{ backgroundColor: s.color + '15' }} textStyle={{ color: s.color, fontSize: 11 }}>{s.label}</Chip>;
  };

  if (loading) {
    return <View style={[styles.loading, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Document Requests</Text>
          <Button mode="contained" onPress={() => {}} icon="plus">New Request</Button>
        </View>
        {requests.map((req) => (
          <TouchableOpacity key={req.id}>
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.row}>
                <Icon name="file-sign" size={24} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                    {req.requestType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    Requested: {new Date(req.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {getStatusChip(req.status)}
              </View>
            </Surface>
          </TouchableOpacity>
        ))}
        {requests.length === 0 && (
          <Surface style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
            <Icon name="file-sign" size={40} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: Spacing.sm }}>No document requests</Text>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.xl }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontWeight: '700' },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  empty: { borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: 'center' },
});

export default DocumentRequestsScreen;
