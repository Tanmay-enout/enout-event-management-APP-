/**
 * Environment configuration utilities
 */

export const env = {
  // API configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003',
  
  // Development mode
  isDev: process.env.NODE_ENV === 'development',
  
  // Admin credentials
  adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123',
} as const;