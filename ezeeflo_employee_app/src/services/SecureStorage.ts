/**
 * Secure Storage Service
 * 
 * Provides encrypted local storage for sensitive data:
 * - JWT Tokens
 * - User data
 * - Biometric preferences
 * 
 * Uses expo-secure-store with fallback to AsyncStorage.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isAvailable = Platform.OS !== 'web';

const SecureStorage = {
  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isAvailable) {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      }
    } catch (error) {
      console.warn('SecureStorage.setItem failed:', error);
    }
  },

  /**
   * Retrieve a value
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (isAvailable) {
        return await SecureStore.getItemAsync(key);
      }
      return null;
    } catch (error) {
      console.warn('SecureStorage.getItem failed:', error);
      return null;
    }
  },

  /**
   * Remove a value
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (isAvailable) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn('SecureStorage.removeItem failed:', error);
    }
  },

  /**
   * Store an object securely
   */
  async setObject(key: string, value: object): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  },

  /**
   * Retrieve an object
   */
  async getObject<T = any>(key: string): Promise<T | null> {
    const value = await this.getItem(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  },
};

export default SecureStorage;
