/**
 * Payslip Detail Screen - Placeholder
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Surface, Button, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Spacing, BorderRadius } from '../../theme';

const PayslipDetailScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Payslip Detail</Text>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Icon name="file-pdf-box" size={48} color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginTop: Spacing.md }}>Payslip details will load here</Text>
          <Button mode="contained" icon="download" style={{ marginTop: Spacing.xl }}>Download PDF</Button>
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  title: { fontWeight: '700', marginBottom: Spacing.xl },
  card: { borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center' },
});

export default PayslipDetailScreen;
