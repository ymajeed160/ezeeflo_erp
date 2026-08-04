/**
 * Application Configuration
 * 
 * Central configuration for the EzeeFlo Employee mobile app.
 * Values are sourced from environment variables with sensible defaults.
 */

const Config = {
  // API Configuration
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://10.255.254.30:5001',
    HR_PREFIX: '/api/hr',
    TIMEOUT: 30000, // 30 seconds
    RETRY_COUNT: 2,
  },

  // Authentication Configuration
  AUTH: {
    TOKEN_KEY: 'ezeeflo_access_token',
    REFRESH_TOKEN_KEY: 'ezeeflo_refresh_token',
    USER_KEY: 'ezeeflo_user_data',
    BIOMETRIC_KEY: 'ezeeflo_biometric_enabled',
    REMEMBER_ME_KEY: 'ezeeflo_remember_me',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh 5 min before expiry
  },

  // Company Configuration
  COMPANY: {
    COMPANY_ID_KEY: 'ezeeflo_active_company_id',
    COMPANY_DATA_KEY: 'ezeeflo_active_company_data',
  },

  // Offline Configuration
  OFFLINE: {
    MAX_OFFLINE_ATTENDANCE: 30, // Max offline attendance records
    SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
    RETRY_INTERVAL: 60 * 1000, // 1 minute
  },

  // Location Configuration
  LOCATION: {
    ACCURACY_THRESHOLD: 50, // meters
    MAX_GEOFENCE_RADIUS: 500, // meters
    LOCATION_TIMEOUT: 15000, // 15 seconds
    MIN_UPDATE_INTERVAL: 60000, // 1 minute
  },

  // Feature Flags
  FEATURES: {
    BIOMETRIC_LOGIN: true,
    GPS_ATTENDANCE: true,
    QR_ATTENDANCE: false, // Future
    BLUETOOTH_ATTENDANCE: false, // Future
    FACE_VERIFICATION: false, // Future
    OFFLINE_ATTENDANCE: true,
    PUSH_NOTIFICATIONS: true,
    DARK_MODE: true,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  // Date Formats
  DATE_FORMATS: {
    DISPLAY: 'DD MMM YYYY',
    API: 'YYYY-MM-DD',
    DATETIME: 'DD MMM YYYY HH:mm',
    TIME: 'HH:mm',
  },
} as const;

export default Config;
