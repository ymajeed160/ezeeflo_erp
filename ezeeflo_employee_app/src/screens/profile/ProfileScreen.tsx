/**
 * My Profile Screen
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Surface, Avatar, Divider, List } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';
import { Spacing, BorderRadius } from '../../theme';

const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const infoSections = [
    { title: 'Personal Information', icon: 'account-details', items: [
      { label: 'Full Name', value: `${user?.firstName || ''} ${user?.lastName || ''}` },
      { label: 'Email', value: user?.email || '-' },
      { label: 'Role', value: user?.role || '-' },
    ]},
    { title: 'Employment', icon: 'briefcase', items: [
      { label: 'Employee Code', value: user?.employeeNumber || '-' },
      { label: 'Department', value: '-' },
      { label: 'Designation', value: '-' },
      { label: 'Joining Date', value: '-' },
    ]},
    { title: 'Contact', icon: 'phone', items: [
      { label: 'Mobile', value: user?.mobileNumber || '-' },
      { label: 'Work Email', value: user?.email || '-' },
    ]},
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.profileHeader}>
          <Avatar.Text size={72} label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
            style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={[styles.name, { color: theme.colors.onBackground }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{user?.role}</Text>
        </View>

        {infoSections.map((section, si) => (
          <View key={si}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.outline }]}>
              {section.title}
            </Text>
            <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              {section.items.map((item, ii) => (
                <View key={ii}>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.outline, width: 120 }}>{item.label}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '500', flex: 1 }}>{item.value}</Text>
                  </View>
                  {ii < section.items.length - 1 && <Divider />}
                </View>
              ))}
            </Surface>
          </View>
        ))}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl },
  profileHeader: { alignItems: 'center', marginBottom: Spacing.xxl },
  name: { fontWeight: '700', marginTop: Spacing.md },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.xl, marginBottom: Spacing.sm, marginLeft: Spacing.sm },
  section: { borderRadius: BorderRadius.lg, overflow: 'hidden', elevation: 1 },
  infoRow: { flexDirection: 'row', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
});

export default ProfileScreen;
