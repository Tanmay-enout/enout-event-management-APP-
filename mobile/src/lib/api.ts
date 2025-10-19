import { mockApi } from '../mocks/mobileMocks';
import { httpClient } from './http';
import { API_ENDPOINTS, DEV_CONFIG } from './config';
import { eventContext } from './eventContext';
import { storage } from './storage';

// Toggle to use real API or mocks
export const USE_MOCKS = false;

interface ApiResponse<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
  inviteStatus?: string;
  token?: string;
  user?: {
    email: string;
    id: string;
    role: string;
  };
}

// API adapter that calls mocks directly (no fetch)
export const api = {
  // Auth APIs
  async requestEmailOtp(params: { email: string }): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.requestEmailOtp(params);
      } catch (error) {
        console.error('requestEmailOtp error:', error);
        throw error;
      }
    }

    // Development auth bypass - accept fixed dev email
    if (DEV_CONFIG.DEV_AUTH_ENABLED && params.email === DEV_CONFIG.DEV_EMAIL) {
      console.log('DEV MODE: Accepting dev email for OTP request:', params.email);
      return {
        ok: true,
        message: 'OTP sent successfully (dev mode)',
        inviteStatus: 'pending', // Default to pending for dev flow
      };
    }

    try {
      const response = await httpClient.post(API_ENDPOINTS.AUTH.SEND_OTP, params);
      
      // The API might return void, so we handle that
      if (response.ok) {
        return {
          ok: true,
          message: 'OTP sent successfully',
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to send OTP',
          // Note: We might need to handle inviteStatus based on API response
          // This would need to be updated based on actual API behavior
        };
      }
    } catch (error) {
      console.error('requestEmailOtp error:', error);
      throw error;
    }
  },

  async verifyEmail(params: { email: string; code: string }): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.verifyEmail(params);
      } catch (error) {
        console.error('verifyEmail error:', error);
        throw error;
      }
    }

    // Development auth bypass - accept fixed dev credentials
    if (DEV_CONFIG.DEV_AUTH_ENABLED && 
        params.email === DEV_CONFIG.DEV_EMAIL && 
        params.code === DEV_CONFIG.DEV_OTP) {
      console.log('DEV MODE: Accepting dev email/OTP verification:', params.email);
      
      // Store dev token and email for future authenticated requests
      const devToken = 'dev-token-' + Date.now();
      await storage.setItem('auth_token', devToken);
      await storage.setItem('auth_email', params.email);
      
      return {
        ok: true,
        message: 'Email verified successfully (dev mode)',
        token: devToken,
        inviteStatus: 'pending', // Default to pending for dev flow
      };
    }

    try {
      const response = await httpClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        email: params.email,
        otp: params.code,
      });

      if (response.ok && response.data?.access_token) {
        // Store the token and email for future authenticated requests
        await storage.setItem('auth_token', response.data.access_token);
        await storage.setItem('auth_email', params.email);
        
        return {
          ok: true,
          message: 'Email verified successfully',
          token: response.data.access_token,
          // Note: We might need to get inviteStatus from another endpoint
          inviteStatus: 'pending', // This should come from the API response
        };
      } else {
        throw new Error(response.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('verifyEmail error:', error);
      throw error;
    }
  },

  async resendOtp(params: { email: string }): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.resendOtp(params);
      } catch (error) {
        console.error('resendOtp error:', error);
        throw error;
      }
    }

    // For now, reuse the same endpoint as requestEmailOtp
    try {
      const response = await httpClient.post(API_ENDPOINTS.AUTH.SEND_OTP, params);
      
      if (response.ok) {
        return {
          ok: true,
          message: 'OTP resent successfully',
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to resend OTP',
        };
      }
    } catch (error) {
      console.error('resendOtp error:', error);
      throw error;
    }
  },

  // Invite APIs
  async getInvite(): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.getInvite();
      } catch (error) {
        console.error('getInvite error:', error);
        throw error;
      }
    }

    // Development auth bypass - return proper invite structure for dev user
    const currentEventId = await eventContext.getCurrentEventId();
    const userEmail = await storage.getItem('auth_email');
    
    if (DEV_CONFIG.DEV_AUTH_ENABLED && userEmail === DEV_CONFIG.DEV_EMAIL) {
      console.log('DEV MODE: Returning dev invite data');
      return {
        ok: true,
        event: { id: currentEventId },
        inviteStatus: 'pending', // Always pending for dev mode to show accept button
      };
    }

    try {
      if (!userEmail) {
        return {
          ok: false,
          message: 'No authenticated user email found',
          inviteStatus: 'not_found',
        };
      }

      // For now, we'll return a basic response
      // In a real implementation, this would query the invites endpoint for the user
      const inviteResponse = await httpClient.get(API_ENDPOINTS.INVITES.LIST(currentEventId));
      
      if (inviteResponse.ok) {
        // Check if the current user has an invite for this event
        const invites = inviteResponse.data?.data || [];
        const userInvite = invites.find((invite: any) => invite.email === userEmail);
        
        return {
          ok: true,
          event: { id: currentEventId }, // Basic event info
          inviteStatus: userInvite ? 'accepted' : 'pending', // Simplified for now
        };
      } else {
        return {
          ok: false,
          message: 'Failed to get invite status',
          inviteStatus: 'not_found',
        };
      }
    } catch (error) {
      console.error('getInvite error:', error);
      return {
        ok: false,
        message: 'Error getting invite',
        inviteStatus: 'not_found',
      };
    }
  },

  async acceptInvite(): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.acceptInvite();
      } catch (error) {
        console.error('acceptInvite error:', error);
        throw error;
      }
    }

    // Development auth bypass - always succeed for dev user
    const userEmail = await storage.getItem('auth_email');
    if (DEV_CONFIG.DEV_AUTH_ENABLED && userEmail === DEV_CONFIG.DEV_EMAIL) {
      console.log('DEV MODE: Accepting invite for dev user');
      return {
        ok: true,
        message: 'Invite accepted successfully (dev mode)',
      };
    }

    // Note: This would need to be implemented based on the actual API
    // For now, return success to allow the app flow to continue
    console.warn('acceptInvite - real API implementation needed');
    return {
      ok: true,
      message: 'Invite accepted successfully',
    };
  },

  // Tasks APIs
  async uploadId(file: any): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.uploadId(file);
      } catch (error) {
        console.error('uploadId error:', error);
        throw error;
      }
    }

    // Note: File upload endpoint needs to be determined
    console.warn('uploadId API endpoint not yet implemented for real API');
    return {
      ok: false,
      message: 'uploadId not implemented yet',
    };
  },

  async saveRegistrationForm(values: any): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.saveRegistrationForm(values);
      } catch (error) {
        console.error('saveRegistrationForm error:', error);
        throw error;
      }
    }

    // This could potentially use the profile update endpoint
    try {
      const currentEventId = await eventContext.getCurrentEventId();
      const response = await httpClient.patch(API_ENDPOINTS.MOBILE.PROFILE(currentEventId), values);
      
      if (response.ok) {
        return {
          ok: true,
          message: 'Registration form saved',
        };
      } else {
        throw new Error(response.message || 'Failed to save registration form');
      }
    } catch (error) {
      console.error('saveRegistrationForm error:', error);
      throw error;
    }
  },

  async requestPhoneOtp(params?: { phone: string }): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.requestPhoneOtp(params || { phone: '' });
      } catch (error) {
        console.error('requestPhoneOtp error:', error);
        throw error;
      }
    }

    // Note: Phone OTP endpoint needs to be determined
    console.warn('requestPhoneOtp API endpoint not yet implemented for real API');
    return {
      ok: false,
      message: 'requestPhoneOtp not implemented yet',
    };
  },

  async verifyPhone(params: { code: string }): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.verifyPhone(params);
      } catch (error) {
        console.error('verifyPhone error:', error);
        throw error;
      }
    }

    // Note: Phone verification endpoint needs to be determined
    console.warn('verifyPhone API endpoint not yet implemented for real API');
    return {
      ok: false,
      message: 'verifyPhone not implemented yet',
    };
  },

  // Inbox APIs
  async listMessages(eventId?: string): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.listMessages();
      } catch (error) {
        console.error('listMessages error:', error);
        throw error;
      }
    }

    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      const response = await httpClient.get(API_ENDPOINTS.MOBILE.MESSAGES(currentEventId));
      
      if (response.ok) {
        // Map API response to expected format
        const apiData = response.data as any;
        return {
          ok: true,
          data: apiData,
          // Map the API response format to the expected format for backward compatibility
          items: apiData?.data || apiData || [],
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to load messages',
        };
      }
    } catch (error) {
      console.error('listMessages error:', error);
      throw error;
    }
  },

  async getMessage(id: string, eventId?: string): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.getMessage(id);
      } catch (error) {
        console.error('getMessage error:', error);
        throw error;
      }
    }

    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      const response = await httpClient.get(API_ENDPOINTS.MOBILE.MESSAGE_DETAIL(currentEventId, id));
      
      if (response.ok) {
        return {
          ok: true,
          data: response.data,
          // Map API response to expected format
          subject: response.data?.title,
          text: response.data?.body,
          attachments: response.data?.attachments || [],
        };
      } else {
        throw new Error(response.message || 'Message not found');
      }
    } catch (error) {
      console.error('getMessage error:', error);
      throw error;
    }
  },

  async acknowledgeMessage(id: string, eventId?: string): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.acknowledgeMessage(id);
      } catch (error) {
        console.error('acknowledgeMessage error:', error);
        throw error;
      }
    }

    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      const response = await httpClient.post(API_ENDPOINTS.MOBILE.ACKNOWLEDGE_MESSAGE(currentEventId, id));
      
      if (response.ok) {
        return {
          ok: true,
          message: 'Message acknowledged',
        };
      } else {
        throw new Error(response.message || 'Failed to acknowledge message');
      }
    } catch (error) {
      console.error('acknowledgeMessage error:', error);
      throw error;
    }
  },

  // Schedule APIs
  async getSchedule(eventId?: string): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.getSchedule(eventId || 'event-1');
      } catch (error) {
        console.error('getSchedule error:', error);
        throw error;
      }
    }

    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      const response = await httpClient.get(API_ENDPOINTS.SCHEDULE.LIST(currentEventId));
      
      if (response.ok) {
        // Map API response to expected format
        const apiData = response.data as any;
        return {
          ok: true,
          data: apiData?.data || apiData || [],
        };
      } else {
        throw new Error(response.message || 'Failed to load schedule');
      }
    } catch (error) {
      console.error('getSchedule error:', error);
      throw error;
    }
  },

  // Profile APIs
  async getMe(eventId?: string): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.getMe();
      } catch (error) {
        console.error('getMe error:', error);
        throw error;
      }
    }

    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      const response = await httpClient.get(API_ENDPOINTS.MOBILE.PROFILE(currentEventId));
      
      if (response.ok) {
        return {
          ok: true,
          data: response.data,
        };
      } else {
        throw new Error(response.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('getMe error:', error);
      throw error;
    }
  },

  async updateMe(partial: any, eventId?: string): Promise<ApiResponse> {
    if (USE_MOCKS) {
      try {
        return await mockApi.updateMe(partial);
      } catch (error) {
        console.error('updateMe error:', error);
        throw error;
      }
    }

    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      const response = await httpClient.patch(API_ENDPOINTS.MOBILE.PROFILE(currentEventId), partial);
      
      if (response.ok) {
        return {
          ok: true,
          message: 'Profile updated successfully',
          data: response.data,
        };
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('updateMe error:', error);
      throw error;
    }
  },

  // Helper to get current store state (for debugging and status checking)
  getStore() {
    if (USE_MOCKS) {
      return mockApi.getStore();
    }
    
    console.warn('getStore() is only available in mock mode. Real API mode cannot provide mock store state.');
    return null;
  },
};
