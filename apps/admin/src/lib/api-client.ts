/**
 * Central API client for live backend communication
 */

import { env } from './env';

export interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Get authorization token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_auth_token');
}

/**
 * Build query string from object
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}

/**
 * Central API client
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(path: string, options: { query?: Record<string, any> } = {}): Promise<T> {
    const url = new URL(path, env.apiUrl);
    
    if (options.query) {
      const queryString = buildQueryString(options.query);
      if (queryString) {
        url.search = queryString;
      }
    }
    
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Client: Making GET request to', url.toString());
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('API Client: Response received', response.status);
      
      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        
        // Handle rate limiting (429) with retry
        if (response.status === 429) {
          console.log('API Client: Rate limited, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          // Retry once
          const retryResponse = await fetch(url.toString(), {
            method: 'GET',
            headers,
            signal: controller.signal,
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            console.log('API Client: Retry successful');
            return retryData;
          }
        }
        
        throw new ApiClientError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      console.log('API Client: Data received', data.length || 'no length');
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('API Client: Request failed', error);
      
      // Handle 401 unauthorized responses
      if (error instanceof ApiClientError && error.status === 401) {
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_email');
        window.location.href = '/login';
      }
      
      throw error;
    }
  },
  
  /**
   * POST request
   */
  async post<T>(path: string, body: any): Promise<T> {
    const url = new URL(path, env.apiUrl);
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      throw new ApiClientError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }
    
    return response.json();
  },
  
  /**
   * PATCH request
   */
  async patch<T>(path: string, body: any): Promise<T> {
    const url = new URL(path, env.apiUrl);
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      // Handle 401 unauthorized responses
      if (response.status === 401) {
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_email');
        window.location.href = '/login';
      }
      
      throw new ApiClientError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }
    
    return response.json();
  },
  
  /**
   * DELETE request
   */
  async del<T>(path: string): Promise<T> {
    const url = new URL(path, env.apiUrl);
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      // Handle 401 unauthorized responses
      if (response.status === 401) {
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_email');
        window.location.href = '/login';
      }
      
      throw new ApiClientError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }
    
    // DELETE requests might not return JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return undefined as T;
  },
};