/**
 * Biometric Authentication Service
 * 
 * Provides fingerprint / face ID authentication
 * using expo-local-authentication.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const BiometricService = {
  /**
   * Check if biometric hardware is available
   */
  isHardwareAvailable: async (): Promise<boolean> => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  },

  /**
   * Check if biometrics are enrolled on the device
   */
  isEnrolled: async (): Promise<boolean> => {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  /**
   * Get supported biometric types
   */
  getSupportedTypes: async (): Promise<LocalAuthentication.AuthenticationType[]> => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types;
  },

  /**
   * Get a user-friendly name for the biometric type
   */
  getBiometricTypeName: async (): Promise<string> => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Scan';
    }
    return 'Biometric';
  },

  /**
   * Authenticate using biometrics
   */
  authenticate: async (reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to access EzeeFlo',
        fallbackLabel: 'Use password instead',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        return { success: true };
      }

      if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        return { success: false, error: 'Authentication cancelled' };
      }

      return { success: false, error: result.error || 'Authentication failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Biometric authentication failed' };
    }
  },

  /**
   * Get the security level of the biometric hardware
   */
  getSecurityLevel: async (): Promise<LocalAuthentication.SecurityLevel> => {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level;
  },
};

export default BiometricService;
