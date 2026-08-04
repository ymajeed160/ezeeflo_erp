/**
 * Screen Container
 * 
 * Base layout wrapper for all screens with safe area handling.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Appbar, Searchbar } from 'react-native-paper';
import { Spacing } from '../theme';

interface ScreenContainerProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollable?: boolean;
  children: React.ReactNode;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  showSearch,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  rightAction,
  refreshing,
  onRefresh,
  scrollable = true,
  children,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const Content = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        refreshControl: onRefresh ? (
          <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />
        ) : undefined,
      }
    : { style: styles.content };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status bar spacer */}
      <View style={{ height: insets.top, backgroundColor: theme.colors.surface }} />

      {/* Header */}
      {(title || showBack || showSearch) && (
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Appbar.Header style={styles.appbar}>
            {showBack && <Appbar.BackAction onPress={onBack} />}
            <Appbar.Content
              title={title || ''}
              subtitle={subtitle}
              titleStyle={styles.title}
              subtitleStyle={styles.subtitle}
            />
            {rightAction && (
              <Appbar.Action
                icon={rightAction.icon}
                onPress={rightAction.onPress}
              />
            )}
          </Appbar.Header>
          {showSearch && onSearchChange && (
            <Searchbar
              placeholder={searchPlaceholder}
              onChangeText={onSearchChange}
              value={searchValue || ''}
              style={styles.searchBar}
            />
          )}
        </View>
      )}

      {/* Content */}
      <Content {...contentProps}>{children}</Content>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  appbar: {
    elevation: 0,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  searchBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    elevation: 0,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
});

export default ScreenContainer;
