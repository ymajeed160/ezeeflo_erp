/**
 * Settings Screen
 */
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme, Surface, Switch, Divider, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';
import BiometricService from '../../services/BiometricService';
import { Spacing, BorderRadius } from '../../theme';

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isBiometricEnabled, toggleBiometric, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleBiometricToggle = async () => {
    if (!isBiometricEnabled) {
      const available = await BiometricService.isHardwareAvailable();
      if (!available) { Alert.alert('Not Available', 'Biometric authentication is not available on this device.'); return; }
      const enrolled = await BiometricService.isEnrolled();
      if (!enrolled) { Alert.alert('Not Enrolled', 'Please set up biometric authentication in your device settings.'); return; }
    }
    toggleBiometric(!isBiometricEnabled);
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change flow will open here.');
  };

  const settingsGroups = [
    { title: 'Appearance', items: [
      { icon: 'theme-light-dark', label: 'Dark Mode', type: 'switch', value: darkMode, onToggle: setDarkMode },
    ]},
    { title: 'Security', items: [
      { icon: 'fingerprint', label: 'Biometric Login', type: 'switch', value: isBiometricEnabled, onToggle: handleBiometricToggle },
      { icon: 'lock-reset', label: 'Change Password', type: 'button', onPress: handleChangePassword },
    ]},
    { title: 'Notifications', items: [
      { icon: 'bell-outline', label: 'Push Notifications', type: 'switch', value: pushNotifs, onToggle: setPushNotifs },
    ]},
    { title: 'Privacy', items: [
      { icon: 'shield-account', label: 'Privacy Settings', type: 'button', onPress: () => {} },
    ]},
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Settings</Text>

        {settingsGroups.map((group, gi) => (
          <View key={gi}>
            <Text variant="titleSmall" style={[styles.groupTitle, { color: theme.colors.outline }]}>{group.title}</Text>
            <Surface style={[styles.groupCard, { backgroundColor: theme.colors.surface }]}>
              {group.items.map((item, ii) => (
                <View key={ii}>
                  <View style={styles.itemRow}>
                    <Icon name={item.icon} size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1, marginLeft: Spacing.md }}>
                      {item.label}
                    </Text>
                    {item.type === 'switch' && item.onToggle && (
                      <Switch value={item.value as boolean} onValueChange={item.onToggle} />
                    )}
                    {item.type === 'button' && (
                      <Icon name="chevron-right" size={20} color={theme.colors.outline} />
                    )}
                  </View>
                  {ii < group.items.length - 1 && <Divider />}
                </View>
              ))}
            </Surface>
          </View>
        ))}

        <Text variant="titleSmall" style={[styles.groupTitle, { color: theme.colors.outline, marginTop: Spacing.xl }]}>Account</Text>
        <TouchableOpacity onPress={logout}>
          <Surface style={[styles.logoutCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.itemRow}>
              <Icon name="logout" size={20} color="#ef4444" />
              <Text variant="bodyMedium" style={{ color: '#ef4444', flex: 1, marginLeft: Spacing.md, fontWeight: '500' }}>
                Sign Out
              </Text>
            </View>
          </Surface>
        </TouchableOpacity>

        <Text variant="bodySmall" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: Spacing.xxl }}>
          EzeeFlo Employee v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }, scroll: { padding: Spacing.xl },
  title: { fontWeight: '700', marginBottom: Spacing.xl },
  groupTitle: { textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.xl, marginBottom: Spacing.sm, marginLeft: Spacing.sm },
  groupCard: { borderRadius: BorderRadius.lg, overflow: 'hidden', elevation: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  logoutCard: { borderRadius: BorderRadius.lg, overflow: 'hidden', elevation: 1, marginTop: Spacing.sm },
});

export default SettingsScreen;
