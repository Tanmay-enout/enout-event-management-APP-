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
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers,
        },
        ...options,
      };

      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      console.log(`Making ${options.method || 'GET'} request to: ${url}`);
      
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

      if (!response.ok) {
        return {
          ok: false,
          message: data?.message || data || `HTTP ${response.status}`,
          status: response.status,
        };
      }

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

  async post<T>(endpoint: string, data?: any): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
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
