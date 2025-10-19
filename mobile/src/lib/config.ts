// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3003',
  // Add timeout and other settings
  TIMEOUT: 10000,
};

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/api/auth/otp/send',
    VERIFY_OTP: '/api/auth/otp/verify',
    ATTENDEE_VERIFY: '/api/auth/attendee/verify',
  },
  MOBILE: {
    PROFILE: (eventId: string) => `/events/${eventId}/profile`,
    MESSAGES: (eventId: string) => `/events/${eventId}/mobile-messages`,
    MESSAGE_DETAIL: (eventId: string, id: string) => `/events/${eventId}/mobile-messages/${id}`,
    ACKNOWLEDGE_MESSAGE: (eventId: string, id: string) => `/events/${eventId}/mobile-messages/${id}/acknowledge`,
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

// Development authentication configuration
export const DEV_CONFIG = {
  // Enable development auth bypass
  DEV_AUTH_ENABLED: true,
  // Fixed development credentials
  DEV_EMAIL: 'dev@test.com',
  DEV_OTP: '123456',
};
