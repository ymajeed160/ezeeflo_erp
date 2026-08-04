/**
 * More Screen
 * 
 * Hub for all secondary features:
 * Documents, Requests, Profile, Directory, Assets, 
 * Approvals, Notifications, Help, Settings
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, Avatar, Badge, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../hooks/useAuth';
import NotificationsAPI from '../api/notificationsApi';
import ApprovalsAPI from '../api/approvalsApi';
import { Spacing, BorderRadius } from '../theme';

interface MenuItem {
  icon: string;
  label: string;
  screen: string;
  color: string;
  badge?: number;
  isManager?: boolean;
}

const MoreScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, activeCompany, logout } = useAuth();

  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [notifRes, approvalRes] = await Promise.all([
          NotificationsAPI.getUnreadCount(),
          ApprovalsAPI.getCount().catch(() => ({ data: { total: 0 } })),
        ]);
        if (notifRes.data) setUnreadNotifs(notifRes.data.count);
        if (approvalRes.data) setPendingApprovals(approvalRes.data.total);
      } catch {}
    })();
  }, []);

  const menuItems: MenuItem[] = [
    { icon: 'account-circle', label: 'My Profile', screen: 'Profile', color: '#3b82f6' },
    { icon: 'file-document-multiple', label: 'Documents', screen: 'Documents', color: '#6366f1' },
    { icon: 'file-sign', label: 'Document Requests', screen: 'DocumentRequests', color: '#8b5cf6' },
    { icon: 'account-group', label: 'Company Directory', screen: 'CompanyDirectory', color: '#06b6d4' },
    { icon: 'laptop', label: 'My Assets', screen: 'MyAssets', color: '#f59e0b' },
    { icon: 'bell-outline', label: 'Notifications', screen: 'Notifications', color: '#ef4444', badge: unreadNotifs },
    { icon: 'check-circle-outline', label: 'Approvals', screen: 'Approvals', color: '#10b981', badge: pendingApprovals, isManager: true },
    { icon: 'help-circle-outline', label: 'Help & Support', screen: 'Help', color: '#0ea5e9' },
    { icon: 'cog-outline', label: 'Settings', screen: 'Settings', color: '#64748b' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}>
        {/* User Card */}
        <Surface style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.userRow}>
            <Avatar.Text
              size={56}
              label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              color={theme.colors.primary}
            />
            <View style={styles.userInfo}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{user?.email}</Text>
              {activeCompany && (
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  {activeCompany.name}
                </Text>
              )}
            </View>
          </View>
        </Surface>

        <Divider style={{ marginVertical: Spacing.xl }} />

        {/* Menu Items */}
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Surface style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Icon name={item.icon} size={22} color={item.color} />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, flex: 1, fontWeight: '500' }}>
                  {item.label}
                </Text>
                {item.badge ? (
                  <Badge size={20} style={{ backgroundColor: item.color }}>{item.badge}</Badge>
                ) : (
                  <Icon name="chevron-right" size={20} color={theme.colors.outline} />
                )}
              </View>
            </Surface>
          </TouchableOpacity>
        ))}

        <Divider style={{ marginVertical: Spacing.xl }} />

        {/* Logout */}
        <TouchableOpacity onPress={logout}>
          <Surface style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: '#ef444415' }]}>
                <Icon name="logout" size={22} color="#ef4444" />
              </View>
              <Text variant="bodyLarge" style={{ color: '#ef4444', flex: 1, fontWeight: '500' }}>
                Sign Out
              </Text>
            </View>
          </Surface>
        </TouchableOpacity>

        <Text variant="bodySmall" style={[styles.version, { color: theme.colors.outline }]}>
          EzeeFlo Employee App v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  userCard: { borderRadius: BorderRadius.xl, padding: Spacing.lg, elevation: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { marginLeft: Spacing.lg, flex: 1 },
  menuItem: { borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, elevation: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  menuIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  version: { textAlign: 'center', marginTop: Spacing.xl },
});

export default MoreScreen;
