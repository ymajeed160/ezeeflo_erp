/**
 * My Assets Screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, Chip, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Spacing, BorderRadius } from '../../theme';
import AssetsAPI from '../../api/assetsApi';
import type { EmployeeAsset } from '../../types';

const getAssetIcon = (type: string) => {
  const map: Record<string, string> = { laptop: 'laptop', mobile_phone: 'cellphone', sim_card: 'sim', access_card: 'card-badge', vehicle: 'car', equipment: 'tools' };
  return map[type] || 'package-variant';
};

const MyAssetsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await AssetsAPI.getMyAssets();
      if (res.success && res.data) setAssets(res.data as EmployeeAsset[]);
    } catch (e) { console.warn('Assets fetch error:', e); }
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
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>My Assets</Text>
        {assets.map((asset) => (
          <Surface key={asset.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.row}>
              <Icon name={getAssetIcon(asset.assetType)} size={24} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>{asset.assetName}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{asset.serialNumber}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Assigned: {asset.assignedDate}</Text>
              </View>
              <Chip style={{ backgroundColor: '#10b98115' }} textStyle={{ color: '#10b981', fontSize: 11 }}>Active</Chip>
            </View>
          </Surface>
        ))}
        {assets.length === 0 && (
          <Surface style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
            <Icon name="package-variant-closed" size={40} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: Spacing.sm }}>No assets assigned</Text>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  empty: { borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: 'center', elevation: 1 },
});

export default MyAssetsScreen;
