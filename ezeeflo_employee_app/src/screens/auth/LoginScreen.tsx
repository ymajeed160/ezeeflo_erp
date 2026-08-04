/**
 * Login Screen
 * 
 * Supports login with:
 * - Username, Email, or Employee Number + Password
 * - Remember Me
 * - Biometric Login (Fingerprint / Face ID)
 * - Multi-Company Support
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Checkbox,
  Surface,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';
import BiometricService from '../../services/BiometricService';
import { Spacing, BorderRadius } from '../../theme';

const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { login, isLoading, authenticateWithBiometrics, isBiometricEnabled } = useAuth();

  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      const available = await BiometricService.isHardwareAvailable();
      if (available) {
        const enrolled = await BiometricService.isEnrolled();
        if (enrolled) {
          const typeName = await BiometricService.getBiometricTypeName();
          setBiometricType(typeName);
        }
      }
    };
    checkBiometric();
  }, []);

  const handleLogin = useCallback(async () => {
    setError('');

    if (!credential.trim()) {
      setError('Please enter your username, email, or employee number');
      setShowError(true);
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      setShowError(true);
      return;
    }

    // Determine credential type
    const isEmail = credential.includes('@');
    const isEmployeeNumber = /^[A-Z0-9-]+$/i.test(credential) && !isEmail;

    const credentials = {
      ...(isEmail
        ? { email: credential.trim() }
        : isEmployeeNumber
        ? { employeeNumber: credential.trim() }
        : { username: credential.trim() }),
      password: password.trim(),
      rememberMe,
    };

    const result = await login(credentials);
    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials.');
      setShowError(true);
    }
  }, [credential, password, rememberMe, login]);

  const handleBiometricLogin = useCallback(async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      // Biometric auth succeeded — navigate will be handled by RootNavigator
    } else {
      setError('Biometric authentication failed. Please use password.');
      setShowError(true);
    }
  }, [authenticateWithBiometrics]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Branding */}
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: theme.colors.primaryContainer }]}>
            <Icon name="briefcase-account" size={48} color={theme.colors.primary} />
          </View>
          <Text variant="headlineMedium" style={[styles.appName, { color: theme.colors.onBackground }]}>
            EzeeFlo
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
            Employee Self Service
          </Text>
        </View>

        {/* Login Form */}
        <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={[styles.formTitle, { color: theme.colors.onSurface }]}>
            Sign In
          </Text>

          <TextInput
            label="Username / Email / Employee No."
            value={credential}
            onChangeText={setCredential}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
            autoCapitalize="none"
            autoCorrect={false}
            disabled={isLoading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            disabled={isLoading}
          />

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Checkbox.Android
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Remember Me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            Sign In
          </Button>

          {/* Biometric Login */}
          {biometricType && isBiometricEnabled && (
            <TouchableOpacity
              style={[styles.biometricButton, { borderColor: theme.colors.outlineVariant }]}
              onPress={handleBiometricLogin}
            >
              <Icon
                name={biometricType.includes('Face') ? 'face-recognition' : 'fingerprint'}
                size={28}
                color={theme.colors.primary}
              />
              <Text variant="bodyMedium" style={[styles.biometricText, { color: theme.colors.primary }]}>
                Sign in with {biometricType}
              </Text>
            </TouchableOpacity>
          )}
        </Surface>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            Powered by EzeeFlo Suite
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Error Snackbar */}
      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={4000}
        style={{ backgroundColor: theme.colors.error }}
        action={{
          label: 'OK',
          onPress: () => setShowError(false),
        }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    elevation: 2,
  },
  formTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xl,
  },
  input: {
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    borderRadius: BorderRadius.lg,
  },
  loginButtonContent: {
    paddingVertical: 6,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  biometricText: {
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    gap: 4,
  },
});

export default LoginScreen;
