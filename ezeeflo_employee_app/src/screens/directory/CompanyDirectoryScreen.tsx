/**
 * Company Directory Screen
 * Fetches real employees from the HR API.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, Avatar, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import EmployeeAPI from '../../api/employeeApi';
import { Spacing, BorderRadius } from '../../theme';
import type { Employee } from '../../types';

const CompanyDirectoryScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDirectory = useCallback(async () => {
    try {
      const res = await EmployeeAPI.getDirectory({ limit: 200 });
      if (res.success && res.data) setEmployees(res.data as Employee[]);
    } catch (e) { console.warn('Directory fetch error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDirectory(); }, [fetchDirectory]);

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.department?.name || ''} ${e.designation?.name || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Company Directory</Text>
        <Searchbar placeholder="Search employees..." onChangeText={setSearch} value={search} style={styles.search} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.row}>
              <Avatar.Text size={44} label={`${item.firstName[0]}${item.lastName[0]}`}
                style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                  {item.designation?.name || ''}{item.designation?.name && item.department?.name ? ' · ' : ''}{item.department?.name || ''}
                </Text>
              </View>
              {item.workEmail ? <Icon name="email-outline" size={20} color={theme.colors.outline} /> : null}
            </View>
          </Surface>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { padding: Spacing.xl },
  title: { fontWeight: '700', marginBottom: Spacing.md }, search: { elevation: 0 },
  list: { paddingHorizontal: Spacing.xl },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});

export default CompanyDirectoryScreen;
