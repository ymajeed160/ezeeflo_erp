/**
 * My Documents Screen
 * 
 * Displays employee documents with expiry alerts.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentsAPI from '../../api/documentsApi';
import { Spacing, BorderRadius } from '../../theme';
import type { EmployeeDocument } from '../../types';

const DocumentsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await DocumentsAPI.getAll({ limit: 50 });
        if (res.data) setDocuments(res.data as EmployeeDocument[]);
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const getDocTypeIcon = (type: string): string => {
    const map: Record<string, string> = {
      passport: 'passport', visa: 'card-account-details', emirates_id: 'card-account-details',
      national_id: 'card-account-details', driving_license: 'car', employment_contract: 'file-document',
      certificate: 'certificate', medical_insurance: 'hospital-box', labor_card: 'card-bulleted', other: 'file',
    };
    return map[type] || 'file';
  };

  const getStatusChip = (status: string) => {
    const c: Record<string, { color: string; label: string }> = {
      active: { color: '#10b981', label: 'Active' },
      expired: { color: '#ef4444', label: 'Expired' },
      expiring_soon: { color: '#f59e0b', label: 'Expiring Soon' },
    };
    const s = c[status] || c.active;
    return <Chip style={{ backgroundColor: s.color + '15' }} textStyle={{ color: s.color, fontSize: 11 }}>{s.label}</Chip>;
  };

  if (loading) {
    return <View style={[styles.loading, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>My Documents</Text>
        {documents.map((doc) => (
          <TouchableOpacity key={doc.id}>
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.row}>
                <Icon name={getDocTypeIcon(doc.documentType)} size={24} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                    {doc.documentType.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  {doc.documentNumber && <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{doc.documentNumber}</Text>}
                  {doc.expiryDate && <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Expires: {doc.expiryDate}</Text>}
                </View>
                {getStatusChip(doc.status)}
              </View>
              {doc.fileUrl && (
                <Button mode="text" icon="download" style={{ marginTop: Spacing.sm }}>Download</Button>
              )}
            </Surface>
          </TouchableOpacity>
        ))}
        {documents.length === 0 && (
          <Surface style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
            <Icon name="file-document-outline" size={40} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: Spacing.sm }}>No documents available</Text>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.xl }, title: { fontWeight: '700', marginBottom: Spacing.xl },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  empty: { borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: 'center' },
});

export default DocumentsScreen;
