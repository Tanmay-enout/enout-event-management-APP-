/**
 * Guest API for live backend
 */

import { Guest, PaginatedGuests, InviteRow, GuestFilters } from './types';
// import { env } from '@/lib/env';
import { apiClient, ApiClientError } from '@/lib/api-client';

/**
 * Handle API errors
 */
async function handleApiError(error: any, operation: string): Promise<never> {
  console.error(`API Error in ${operation}:`, error);
  
  if (error instanceof ApiClientError && (error.status >= 500 || error.status === 0)) {
    // Show error toast
    if (typeof window !== 'undefined') {
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Backend unavailable',
        description: 'Please check your API connection',
        variant: 'destructive',
      });
    }
  }
  
  throw error;
}

export const guestsApi = {
  /**
   * List guests for an event
   */
  async getGuests(eventId: string, filters: GuestFilters): Promise<PaginatedGuests> {
    try {
      const queryParams: Record<string, any> = {
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
      };
      
      if (filters.q) queryParams.q = filters.q;
      if (filters.status && filters.status.length > 0) queryParams.status = filters.status.join(',');
      if (filters.sort) queryParams.sort = filters.sort;
      
      // Use invites endpoint which has both invited guests and attendees
      const response = await apiClient.get<any>(`/api/events/${eventId}/invites`, { query: queryParams });
      
      // The API returns { data: [...], page, pageSize, total, totalPages }
      // Transform it to match PaginatedGuests if needed
      return {
        data: response.data || [],
        page: response.page || filters.page || 1,
        pageSize: response.pageSize || filters.pageSize || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      };
    } catch (error) {
      return handleApiError(error, 'getGuests');
    }
  },

  /**
   * Import guests (bulk add)
   */
  async importGuests(eventId: string, guests: InviteRow[]): Promise<{ imported: number; errors: string[] }> {
    try {
      const response = await apiClient.post<{ count: number }>(
        `/api/events/${eventId}/invites/import`,
        { rows: guests } // API expects 'rows' not 'guests'
      );
      return { 
        imported: response.count || 0, 
        errors: [] 
      };
    } catch (error) {
      return handleApiError(error, 'importGuests');
    }
  },

  /**
   * Send invite to a guest
   */
  async sendInvite(eventId: string, inviteId: string): Promise<void> {
    try {
      await apiClient.post(`/api/events/${eventId}/invites/${inviteId}/send`, {});
    } catch (error) {
      return handleApiError(error, 'sendInvite');
    }
  },

  /**
   * Resend invite to a guest
   */
  async resendInvite(eventId: string, inviteId: string): Promise<void> {
    try {
      await apiClient.post(`/api/events/${eventId}/invites/${inviteId}/resend`, {});
    } catch (error) {
      return handleApiError(error, 'resendInvite');
    }
  },

  /**
   * Update guest details
   */
  async updateGuest(eventId: string, inviteId: string, updates: Partial<Guest>): Promise<Guest> {
    try {
      return await apiClient.patch<Guest>(`/api/events/${eventId}/invites/${inviteId}`, updates);
    } catch (error) {
      return handleApiError(error, 'updateGuest');
    }
  },

  /**
   * Delete a guest
   */
  async deleteGuest(eventId: string, inviteId: string): Promise<void> {
    try {
      await apiClient.del(`/api/events/${eventId}/invites/${inviteId}`);
    } catch (error) {
      return handleApiError(error, 'deleteGuest');
    }
  },
};
