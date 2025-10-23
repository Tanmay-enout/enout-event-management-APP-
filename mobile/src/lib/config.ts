// API Configuration - supports both localhost and network IP for physical device testing
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3003',
  // Add timeout and other settings
  TIMEOUT: 10000,
};

// Log configuration on import for debugging
console.log('=== MOBILE APP API CONFIG ===');
console.log('API_BASE_URL:', API_CONFIG.BASE_URL);
console.log('Environment API_URL:', process.env.EXPO_PUBLIC_API_URL);

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/api/auth/otp/send',
    VERIFY_OTP: '/api/auth/otp/verify',
    ATTENDEE_VERIFY: '/api/auth/attendee/verify',
    ACCEPT_INVITE: '/api/auth/invite/accept',
    REQUEST_PHONE_OTP: '/api/auth/phone/request-otp',
    VERIFY_PHONE_OTP: '/api/auth/phone/verify-otp',
  },
  MOBILE: {
    PROFILE: (eventId: string) => `/api/events/${eventId}/profile`,
    UPLOAD_DOCUMENT: (eventId: string) => `/api/events/${eventId}/upload-documents`,
    MESSAGES: (eventId: string) => `/api/events/${eventId}/mobile-messages`,
    MESSAGE_DETAIL: (eventId: string, id: string) => `/api/events/${eventId}/mobile-messages/${id}`,
    ACKNOWLEDGE_MESSAGE: (eventId: string, id: string) => `/api/events/${eventId}/mobile-messages/${id}/acknowledge`,
    EVENT_DETAILS: (eventId: string) => `/api/events/${eventId}`,
  },
  EVENTS: {
    LIST: '/api/events',
    DETAIL: (id: string) => `/api/events/${id}`,
  },
  SCHEDULE: {
    LIST: (eventId: string) => `/api/events/${eventId}/schedule`,
  },
  INVITES: {
    LIST: (eventId: string) => `/api/events/${eventId}/invites`,
    CREATE: (eventId: string) => `/api/events/${eventId}/invites`,
    UPDATE: (eventId: string, inviteId: string) => `/api/events/${eventId}/invites/${inviteId}`,
  },
  HEALTH: {
    CHECK: '/api/health',
  },
};

// Default event ID for development/testing
export const DEFAULT_EVENT_ID = process.env.EXPO_PUBLIC_DEFAULT_EVENT_ID || 'event-1';

// Development authentication configuration - explicit boolean handling
const DEV_AUTH_ENABLED = true;
const DEV_EMAIL_VALUE = 'dev@test.com';
const DEV_OTP_VALUE = '123456';

export const DEV_CONFIG = {
  // Use explicit boolean values to prevent casting issues
  DEV_AUTH_ENABLED: DEV_AUTH_ENABLED,
  // Fixed development credentials
  DEV_EMAIL: DEV_EMAIL_VALUE,
  DEV_OTP: DEV_OTP_VALUE,
};

// Type-safe helper function to check dev auth enabled
export const isDevAuthEnabled = (): boolean => {
  return DEV_AUTH_ENABLED;
};
