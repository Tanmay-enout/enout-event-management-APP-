import { API_CONFIG } from './config';
import { storage } from './storage';

interface HttpResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  status?: number;
}

class HttpClient {
  private baseURL = API_CONFIG.BASE_URL;
  private timeout = API_CONFIG.TIMEOUT;

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await storage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<HttpResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getAuthHeaders();
      
      // Don't set Content-Type for FormData - let the browser set it with boundary
      const isFormData = options.body instanceof FormData;
      const defaultHeaders: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers,
      };

      if (!isFormData) {
        defaultHeaders['Content-Type'] = 'application/json';
      }

      const config: RequestInit = {
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        ...options,
      };

      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      console.log(`=== HTTP REQUEST ===`);
      console.log(`Method: ${options.method || 'GET'}`);
      console.log(`URL: ${url}`);
      console.log(`Base URL: ${this.baseURL}`);
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        // Handle non-JSON responses
        data = await response.text();
      }

      console.log(`Response (${response.status}):`, data);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log('Response not ok, returning error response');
        return {
          ok: false,
          message: data?.message || data || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      console.log('Response ok, returning success response with data:', data);
      return {
        ok: true,
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('HTTP request error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            ok: false,
            message: 'Request timeout',
          };
        }
      }

      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<HttpResponse<T>> {
    let body;
    if (data instanceof FormData) {
      body = data;
    } else if (data) {
      body = JSON.stringify(data);
    }
    
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body,
      ...options,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
