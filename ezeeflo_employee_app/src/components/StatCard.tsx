/**
 * StatCard Component
 * 
 * Reusable statistics card for dashboard and summaries.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Spacing, BorderRadius } from '../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor,
  subtitle,
  trend,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <Surface
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onTouchEnd={onPress}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: (iconColor || theme.colors.primary) + '15' },
          ]}
        >
          <Icon name={icon} size={24} color={iconColor || theme.colors.primary} />
        </View>
        <View style={styles.info}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            {title}
          </Text>
          <Text variant="headlineSmall" style={[styles.value, { color: theme.colors.onSurface }]}>
            {value}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {trend && (
        <View style={styles.trendRow}>
          <Icon
            name={trend.isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend.isPositive ? theme.colors.success : theme.colors.error}
          />
          <Text
            variant="labelSmall"
            style={{
              color: trend.isPositive ? theme.colors.success : theme.colors.error,
              marginLeft: 4,
            }}
          >
            {trend.value}%
          </Text>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  value: {
    fontWeight: '700',
    marginVertical: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});

export default StatCard;
