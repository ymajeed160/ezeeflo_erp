/**
 * Help & Support Screen
 */
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Spacing, BorderRadius } from '../../theme';

const helpItems = [
  { icon: 'frequently-asked-questions', label: 'FAQ', color: '#3b82f6' },
  { icon: 'email-outline', label: 'Contact HR', color: '#6366f1' },
  { icon: 'ticket-outline', label: 'Raise a Ticket', color: '#f59e0b' },
  { icon: 'chat-outline', label: 'Live Chat', color: '#10b981', disabled: true, comingSoon: true },
];

const HelpScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Help & Support</Text>

        <Surface style={[styles.contactCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="headset" size={40} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: Spacing.md }}>
            Need Assistance?
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: Spacing.sm }}>
            Our HR team is here to help with any questions about your employment, benefits, or the EzeeFlo platform.
          </Text>
        </Surface>

        {helpItems.map((item, idx) => (
          <TouchableOpacity key={idx} disabled={item.disabled}>
            <Surface style={[styles.menuItem, { backgroundColor: theme.colors.surface, opacity: item.disabled ? 0.5 : 1 }]}>
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Icon name={item.icon} size={22} color={item.color} />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, flex: 1, fontWeight: '500' }}>
                  {item.label}
                </Text>
                {item.comingSoon && (
                  <Text variant="labelSmall" style={{ color: theme.colors.outline }}>Coming Soon</Text>
                )}
              </View>
            </Surface>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }, scroll: { padding: Spacing.xl },
  title: { fontWeight: '700', marginBottom: Spacing.xl },
  contactCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl, elevation: 1 },
  menuItem: { borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, elevation: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  menuIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
});

export default HelpScreen;
