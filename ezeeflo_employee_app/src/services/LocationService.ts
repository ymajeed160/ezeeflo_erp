/**
 * Location Service
 * 
 * Provides GPS location for attendance validation.
 */

import * as Location from 'expo-location';
import type { GeoLocation } from '../types';
import Config from '../config';

const LocationService = {
  /**
   * Request location permissions
   */
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        return false;
      }

      // For background geofencing (future)
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      return foregroundStatus === 'granted';
    } catch (error) {
      console.warn('Location permission error:', error);
      return false;
    }
  },

  /**
   * Check if location permissions are granted
   */
  hasPermissions: async (): Promise<boolean> => {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Get current position
   */
  getCurrentPosition: async (): Promise<GeoLocation | null> => {
    try {
      const hasPerm = await LocationService.hasPermissions();
      if (!hasPerm) {
        const granted = await LocationService.requestPermissions();
        if (!granted) return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: Config.LOCATION.MIN_UPDATE_INTERVAL,
        mayShowUserSettingsDialog: true,
      });

      // Try to get readable address
      let address: string | undefined;
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (geocode && geocode.length > 0) {
          const addr = geocode[0];
          address = [addr.street, addr.city, addr.region]
            .filter(Boolean)
            .join(', ');
        }
      } catch {}

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || undefined,
        address,
        timestamp: new Date(position.timestamp).toISOString(),
      };
    } catch (error) {
      console.warn('Location fetch error:', error);
      return null;
    }
  },
};

export default LocationService;
