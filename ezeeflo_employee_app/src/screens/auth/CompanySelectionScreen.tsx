/**
 * Company Selection Screen
 * 
 * Allows user to select which company to access after login.
 * Supports multi-company architecture.
 */

import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, Avatar, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';
import { Spacing, BorderRadius } from '../../theme';
import type { CompanyInfo } from '../../types';

const CompanySelectionScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { companies, switchCompany, user, logout } = useAuth();

  const handleSelectCompany = (company: CompanyInfo) => {
    switchCompany(company);
  };

  const renderCompany = ({ item }: { item: CompanyInfo }) => (
    <TouchableOpacity onPress={() => handleSelectCompany(item)}>
      <Surface style={[styles.companyCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.companyRow}>
          <Avatar.Text
            size={48}
            label={item.name.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.primary}
          />
          <View style={styles.companyInfo}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
              {item.name}
            </Text>
            {item.address && (
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                {item.address}
              </Text>
            )}
          </View>
          <Icon name="chevron-right" size={24} color={theme.colors.outline} />
        </View>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
            Select Company
          </Text>
          {user && (
            <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
              Signed in as {user.firstName} {user.lastName}
            </Text>
          )}
        </View>
        <Button mode="text" onPress={logout} textColor={theme.colors.error}>
          Sign Out
        </Button>
      </View>

      <FlatList
        data={companies}
        renderItem={renderCompany}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="domain-off" size={48} color={theme.colors.outline} />
            <Text variant="bodyLarge" style={{ color: theme.colors.outline, marginTop: Spacing.md }}>
              No companies available
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  listContent: {
    padding: Spacing.lg,
  },
  companyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 1,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});

export default CompanySelectionScreen;
