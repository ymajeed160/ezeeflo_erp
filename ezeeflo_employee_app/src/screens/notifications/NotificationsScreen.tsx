/**
 * Notifications Screen
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, IconButton, ActivityIndicator, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationsAPI from '../../api/notificationsApi';
import { Spacing, BorderRadius } from '../../theme';
import type { AppNotification } from '../../types';

const getNotificationIcon = (type: string): string => {
  const map: Record<string, string> = {
    attendance_reminder: 'clock-check-outline', leave_approved: 'calendar-check', leave_rejected: 'calendar-remove',
    leave_submitted: 'send-outline', payroll_released: 'cash-multiple', document_expiry: 'file-alert-outline',
    birthday: 'cake-variant', work_anniversary: 'star-outline', announcement: 'bullhorn-outline',
    training_reminder: 'school-outline', holiday_reminder: 'beach', request_status: 'file-sign',
  };
  return map[type] || 'bell-outline';
};

const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await NotificationsAPI.getAll({ limit: 50 });
        if (res.data) setNotifications(res.data as AppNotification[]);
      } catch (e) { console.warn(e); } finally { setLoading(false); }
    })();
  }, []);

  const handleMarkRead = async (id: string) => {
    await NotificationsAPI.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  if (loading) {
    return <View style={[styles.loading, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + Spacing.lg }]}
        ListHeaderComponent={<Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Notifications</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleMarkRead(item.id)}>
            <Surface style={[styles.card, { backgroundColor: item.isRead ? theme.colors.surface : theme.colors.surfaceVariant }]}>
              <View style={styles.row}>
                <Icon name={getNotificationIcon(item.type)} size={22} color={item.isRead ? theme.colors.outline : theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: item.isRead ? '400' : '600' }}>
                    {item.title}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{item.message}</Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                {!item.isRead && <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />}
              </View>
            </Surface>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Surface style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
            <Icon name="bell-off-outline" size={40} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: Spacing.sm }}>No notifications</Text>
          </Surface>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.xl }, title: { fontWeight: '700', marginBottom: Spacing.xl },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { borderRadius: BorderRadius.lg, padding: Spacing.xxl, alignItems: 'center', marginTop: Spacing.xxl },
});

export default NotificationsScreen;
