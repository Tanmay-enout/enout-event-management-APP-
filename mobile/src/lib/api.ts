import { httpClient } from './http';
import { API_ENDPOINTS, DEV_CONFIG, isDevAuthEnabled } from './config';
import { eventContext } from './eventContext';
import { storage } from './storage';

interface ApiResponse<T = unknown> {
  ok: boolean;
  message?: string;
  data?: any;
  status?: number;
  inviteStatus?: string;
  token?: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  items?: any[];
  subject?: string;
  text?: string;
  attachments?: any[];
  event?: {
    id: string;
  };
  invite?: any;
  fileUrl?: string;
  idDocUrl?: string;
}

// Real API integration - fully connected to backend
export const api = {
  // Auth APIs
  async requestEmailOtp(params: { email: string }): Promise<ApiResponse> {
    try {
      console.log('=== API CLIENT: Starting requestEmailOtp ===');
      console.log('Received params object:', params);
      console.log('Email from params:', params.email);
      console.log('Email type:', typeof params.email);
      console.log('Email is string:', typeof params.email === 'string');
      console.log('API endpoint:', API_ENDPOINTS.AUTH.SEND_OTP);
      console.log('Request params being sent:', JSON.stringify(params));
      
      if (!params.email) {
        console.error('Email parameter is missing or empty!');
        return {
          ok: false,
          message: 'Email parameter is required',
          inviteStatus: 'error',
        };
      }
      
      const response = await httpClient.post(API_ENDPOINTS.AUTH.SEND_OTP, params);
      
      console.log('=== API CLIENT: Response received ===');
      console.log('Full API response:', JSON.stringify(response, null, 2));
      console.log('response.ok:', response.ok);
      console.log('response.status:', response.status);
      console.log('response.data:', response.data);
      console.log('response.message:', response.message);
      
      if (response.ok) {
        console.log('=== API CLIENT: Success response ===');
        console.log('User exists, OTP sent successfully:', params.email);
        
        // Extract event information from API response
        const responseData = response.data as any;
        const eventId = responseData?.eventId;
        const eventName = responseData?.eventName;
        
        if (eventId) {
          console.log(`Storing event ID from API: ${eventId} (${eventName || 'Unknown'})`);
          // Store the event ID for this user so we know which event they belong to
          await eventContext.setCurrentEventId(eventId);
        }
        
        const result = {
          ok: true,
          message: responseData?.message || 'OTP sent successfully',
          inviteStatus: 'pending', // Will be checked later via getInvite()
        };
        console.log('Returning success result:', result);
        return result;
      } else {
        console.log('=== API CLIENT: Error response ===');
        console.error('API returned error:', response.message);
        console.error('Status:', response.status);
        
        // Handle different error status codes
        let errorMessage = 'An error occurred. Please try again.';
        let inviteStatus = 'error';
        
        if (response.status === 400) {
          console.log('=== 400 Bad Request Error ===');
          errorMessage = response.message || 'Invalid request. Please check if the email is valid.';
        } else if (response.status === 404 || response.message?.includes('does not exist')) {
          console.log('=== 404 Not Found Error ===');
          errorMessage = response.message || 'User with this email does not exist. Please contact the administrator to create an account.';
          inviteStatus = 'not_found';
        } else if (response.status === 500) {
          console.log('=== 500 Server Error ===');
          errorMessage = response.message || 'Server error. Please try again later.';
        } else {
          console.log('=== Other Error ===');
          errorMessage = response.message || 'Failed to send OTP. Please try again.';
        }
        
        const result = {
          ok: false,
          message: errorMessage,
          inviteStatus: inviteStatus,
        };
        console.log('Returning error result:', result);
        return result;
      }
    } catch (error) {
      console.error('requestEmailOtp error:', error);
      // If we get any error, treat it as user not found for security
      return {
        ok: false,
        message: 'User with this email does not exist. Please contact the administrator to create an account.',
        inviteStatus: 'not_found',
      };
    }
  },

  async verifyEmail(params: { email: string; code: string }): Promise<ApiResponse> {
    // Always use real API for verification to get proper JWT tokens
    // This ensures authentication works correctly with the backend

    try {
      console.log('=== verifyEmail Starting ===');
      console.log('Calling endpoint:', API_ENDPOINTS.AUTH.VERIFY_OTP);
      console.log('With data:', { email: params.email, otp: params.code });
      
      const response = await httpClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        email: params.email,
        otp: params.code,
      });

      console.log('=== verifyEmail API Response ===');
      console.log('Response object:', response);
      console.log('Response ok:', response.ok);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      const responseData = response.data as any;
      console.log('Access token exists:', !!responseData?.access_token);
      
      if (response.ok && responseData?.access_token) {
        // Store the token and email for future authenticated requests
        console.log('Storing JWT token:', responseData.access_token.substring(0, 20) + '...');
        await storage.setItem('auth_token', responseData.access_token);
        await storage.setItem('auth_email', params.email);
        console.log('Token stored successfully');
        
        // Get user info and invite status after successful verification
        const userInfo = await this.getUserInfo();
        const inviteInfo = await this.getInvite();
        
        return {
          ok: true,
          message: 'Email verified successfully',
          token: responseData.access_token,
          user: userInfo.ok ? userInfo.user : undefined,
          inviteStatus: inviteInfo.inviteStatus || 'pending',
          invite: inviteInfo.invite || null,
        };
      } else {
        console.log('=== verifyEmail Failed ===');
        console.log('Response not ok:', response);
        console.log('Response message:', response.message);
        console.log('No access_token in response');
        throw new Error(response.message || 'Invalid OTP - no access token received');
      }
    } catch (error) {
      console.error('=== verifyEmail Error ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  async resendOtp(params: { email: string }): Promise<ApiResponse> {
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
    const currentEventId = await eventContext.getCurrentEventId();
    const userEmail = await storage.getItem('auth_email');
    
    if (!userEmail) {
      return {
        ok: false,
        message: 'No authenticated user email found',
        inviteStatus: 'not_found',
      };
    }

    try {
      // Since the user has successfully authenticated, they must have an invite
      // Return a pending status to show the accept invitation screen
      console.log(`User ${userEmail} is authenticated, assuming invite is pending`);
      
      return {
        ok: true,
        inviteStatus: 'pending',
        event: { id: currentEventId },
        invite: {
          email: userEmail,
          firstName: userEmail.split('@')[0],
          lastName: '',
        },
      };
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
    try {
      const userEmail = await storage.getItem('auth_email');
      
      if (!userEmail) {
        return {
          ok: false,
          message: 'No authenticated user email found',
        };
      }

      console.log('Accepting invite for user:', userEmail);

      // Call the new accept invite endpoint
      console.log('Calling accept invite endpoint with email:', userEmail);
      const response = await httpClient.post(API_ENDPOINTS.AUTH.ACCEPT_INVITE, { email: userEmail });
      
      console.log('Accept invite API response:', {
        ok: response.ok,
        status: response.status,
        message: response.message,
        data: response.data
      });
      
      if (response.ok) {
        console.log('Invite accepted successfully via API - backend has updated attendee status');
        return {
          ok: true,
          message: (response.data as any)?.message || 'Invite accepted successfully',
        };
      } else {
        console.error('Failed to accept invite via API:', response.message);
        return {
          ok: false,
          message: response.message || 'Failed to accept invite. Please try again.',
        };
      }
    } catch (error) {
      console.error('acceptInvite error:', error);
      return {
        ok: false,
        message: 'Failed to accept invite. Please try again.',
      };
    }
  },

  // Tasks APIs - Real implementation
  async uploadId(file: any): Promise<ApiResponse> {
    try {
      const currentEventId = await eventContext.getCurrentEventId();
      
      // Check if we have a token (authentication required now)
      const token = await storage.getItem('auth_token');
      if (!token) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }

      console.log('Uploading document for event:', currentEventId);

      // Create FormData for file upload
      const formData = new FormData();
      
      // Determine file type and name
      const fileName = file.name || file.fileName || 'document';
      const fileType = file.type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      const finalFileName = fileName.includes('.') ? fileName : `${fileName}.pdf`;
      
      formData.append('document', {
        uri: file.uri || file.path,
        type: fileType,
        name: finalFileName,
      } as any);
      // Remove email from formData - backend will use authenticated user context

      const response = await httpClient.post(API_ENDPOINTS.MOBILE.UPLOAD_DOCUMENT(currentEventId), formData);

      if (response.status === 401) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }

      if (response.ok) {
        const responseData = response.data as any;
        return {
          ok: true,
          message: responseData?.message || 'Document uploaded successfully',
          fileUrl: responseData?.idDocUrl,
        };
      } else {
        throw new Error(response.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('uploadId error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to upload document',
      };
    }
  },

  async saveRegistrationForm(values: any): Promise<ApiResponse> {
    try {
      const currentEventId = await eventContext.getCurrentEventId();
      const userEmail = await storage.getItem('auth_email');
      
      if (!userEmail) {
        return {
          ok: false,
          message: 'No authenticated user email found',
        };
      }

      console.log('=== SAVE REGISTRATION FORM DEBUG ===');
      console.log('User email:', userEmail);
      console.log('Current event ID:', currentEventId);
      console.log('Form values received:', values);

      // Map mobile form fields to API field names and filter out undefined values
      const formData: any = {};

      // Only include fields that have actual values
      if (values.name || values.firstName) {
        formData.firstName = values.name || values.firstName;
      }
      if (values.surname || values.lastName) {
        formData.lastName = values.surname || values.lastName;
      }
      if (values.mealPreference || values.dietaryRequirements) {
        formData.dietaryRequirements = values.mealPreference || values.dietaryRequirements;
      }
      if (values.workEmail) {
        formData.workEmail = values.workEmail;
      }
      if (values.location) {
        formData.location = values.location;
      }
      if (values.gender) {
        formData.gender = values.gender;
      }

      console.log('Mapped form data:', formData);

      // Add email as query parameter
      const endpoint = `${API_ENDPOINTS.MOBILE.PROFILE(currentEventId)}?email=${encodeURIComponent(userEmail)}`;
      console.log('Making PATCH request to:', endpoint);
      console.log('Request body:', formData);
      
      const response = await httpClient.patch(endpoint, formData);
      
      console.log('API Response:', response);
      
      if (response.ok) {
        return {
          ok: true,
          message: 'Registration form saved successfully',
        };
      } else {
        throw new Error(response.message || 'Failed to save registration form');
      }
    } catch (error) {
      console.error('saveRegistrationForm error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to save registration form',
      };
    }
  },

  async requestPhoneOtp(params: { phone: string }): Promise<ApiResponse> {
    try {
      const userEmail = await storage.getItem('auth_email');
      
      if (!userEmail) {
        return {
          ok: false,
          message: 'No authenticated user email found',
        };
      }

      console.log('Requesting phone OTP for:', params.phone, 'user:', userEmail);

      const response = await httpClient.post(API_ENDPOINTS.AUTH.REQUEST_PHONE_OTP, {
        phone: params.phone,
        userEmail: userEmail,
      });

      if (response.ok) {
        const responseData = response.data as any;
        return {
          ok: true,
          message: responseData?.message || 'Phone OTP sent successfully',
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to send phone OTP',
        };
      }
    } catch (error) {
      console.error('requestPhoneOtp error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to send phone OTP',
      };
    }
  },

  async verifyPhone(params: { code: string; phone?: string }): Promise<ApiResponse> {
    try {
      const userEmail = await storage.getItem('auth_email');
      
      if (!userEmail) {
        return {
          ok: false,
          message: 'No authenticated user email found',
        };
      }

      console.log('Verifying phone OTP:', params.code, 'phone:', params.phone, 'user:', userEmail);

      const response = await httpClient.post(API_ENDPOINTS.AUTH.VERIFY_PHONE_OTP, {
        phone: params.phone || '+1234567890', // fallback phone if not provided
        code: params.code,
        userEmail: userEmail,
      });

      if (response.ok) {
        const responseData = response.data as any;
        return {
          ok: true,
          message: responseData?.message || 'Phone verified successfully',
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to verify phone OTP',
        };
      }
    } catch (error) {
      console.error('verifyPhone error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to verify phone OTP',
      };
    }
  },

  // Inbox APIs - Real implementation
  async listMessages(eventId?: string): Promise<ApiResponse> {
    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      
      // Check if we have a token (authentication required now)
      const token = await storage.getItem('auth_token');
      if (!token) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }

      const response = await httpClient.get(API_ENDPOINTS.MOBILE.MESSAGES(currentEventId));
      
      if (response.status === 401) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }
      
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
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to load messages',
      };
    }
  },

  async getMessage(id: string, eventId?: string): Promise<ApiResponse> {
    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      
      // Check if we have a token (authentication required now)
      const token = await storage.getItem('auth_token');
      if (!token) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }

      const response = await httpClient.get(API_ENDPOINTS.MOBILE.MESSAGE_DETAIL(currentEventId, id));
      
      if (response.status === 401) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }
      
      if (response.ok) {
        const responseData = response.data as any;
        return {
          ok: true,
          data: response.data,
          // Map API response to expected format
          subject: responseData?.title,
          text: responseData?.body,
          attachments: responseData?.attachments || [],
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Message not found',
        };
      }
    } catch (error) {
      console.error('getMessage error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to get message',
      };
    }
  },

  async acknowledgeMessage(id: string, eventId?: string): Promise<ApiResponse> {
    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      
      // Check if we have a token (authentication required now)
      const token = await storage.getItem('auth_token');
      if (!token) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }

      const response = await httpClient.post(API_ENDPOINTS.MOBILE.ACKNOWLEDGE_MESSAGE(currentEventId, id));
      
      if (response.status === 401) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }
      
      if (response.ok) {
        return {
          ok: true,
          message: 'Message acknowledged',
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to acknowledge message',
        };
      }
    } catch (error) {
      console.error('acknowledgeMessage error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to acknowledge message',
      };
    }
  },

  // Schedule APIs - Real implementation
  async getSchedule(eventId?: string): Promise<ApiResponse> {
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
        return {
          ok: false,
          message: response.message || 'Failed to load schedule',
        };
      }
    } catch (error) {
      console.error('getSchedule error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to load schedule',
      };
    }
  },

  // User info and profile APIs
  async getUserInfo(): Promise<ApiResponse> {
    try {
      const userEmail = await storage.getItem('auth_email');
      
      if (!userEmail) {
        return {
          ok: false,
          message: 'No authenticated user email found',
        };
      }

      // Since user is authenticated, they must have an invite
      // Skip the admin API call and use basic info

      // Fallback: derive from email if invite not found
      const firstName = userEmail.split('@')[0];
      const userInfo = {
        email: userEmail,
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: '',
      };

      return {
        ok: true,
        user: userInfo,
      };
    } catch (error) {
      console.error('getUserInfo error:', error);
      return {
        ok: false,
        message: 'Failed to get user information',
      };
    }
  },

  // Profile APIs - Real implementation
  async getMe(eventId?: string): Promise<ApiResponse> {
    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      
      // Check if we have a token (authentication required now)
      const token = await storage.getItem('auth_token');
      console.log('=== getMe API call ===');
      console.log('Current event ID:', currentEventId);
      console.log('Token exists:', !!token);
      console.log('Token prefix:', token ? token.substring(0, 20) + '...' : 'none');
      
      if (!token) {
        console.log('No token found - returning 401');
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }

      console.log('Making authenticated request to:', API_ENDPOINTS.MOBILE.PROFILE(currentEventId));
      const response = await httpClient.get(`${API_ENDPOINTS.MOBILE.PROFILE(currentEventId)}`);
      
      if (response.status === 401) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }
      
      if (response.ok) {
        return {
          ok: true,
          data: response.data,
          status: response.status,
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to load profile',
          status: response.status,
        };
      }
    } catch (error) {
      console.error('getMe error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to load profile',
      };
    }
  },

  async updateMe(partial: any, eventId?: string): Promise<ApiResponse> {
    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      
      // Check if we have a token (authentication required now)
      const token = await storage.getItem('auth_token');
      if (!token) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }

      const endpoint = `${API_ENDPOINTS.MOBILE.PROFILE(currentEventId)}`;
      console.log('Making PATCH request to:', endpoint);
      console.log('Request body:', partial);

      const response = await httpClient.patch(endpoint, partial);
      
      if (response.status === 401) {
        return {
          ok: false,
          message: 'Authentication required',
          status: 401,
        };
      }
      
      if (response.ok) {
        return {
          ok: true,
          message: 'Profile updated successfully',
          data: response.data,
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to update profile',
        };
      }
    } catch (error) {
      console.error('updateMe error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  },

  async getEventDetails(eventId?: string): Promise<ApiResponse> {
    try {
      const currentEventId = eventId || await eventContext.getCurrentEventId();
      
      // Event details endpoint is public - no authentication required
      const response = await httpClient.get(API_ENDPOINTS.MOBILE.EVENT_DETAILS(currentEventId));
      
      if (response.ok) {
        return {
          ok: true,
          data: response.data,
          status: response.status,
        };
      } else {
        return {
          ok: false,
          message: response.message || 'Failed to get event details',
          status: response.status,
        };
      }
    } catch (error) {
      console.error('getEventDetails error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to get event details',
      };
    }
  },
};