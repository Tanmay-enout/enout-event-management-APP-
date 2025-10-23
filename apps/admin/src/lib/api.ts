/**
 * API service layer for admin dashboard
 */

import { env } from './env';
import { apiClient } from './api-client';
import { 
  EventType, 
  ItineraryItemType, 
  AttendeeType, 
  MessageType, 
  RoomType,
  UserType 
} from '@enout/shared';

/**
 * Calculate event status based on dates
 */
export function calculateEventStatus(startDate: string, endDate: string): 'pending' | 'in_progress' | 'complete' {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'pending';
  if (now > end) return 'complete';
  return 'in_progress';
}

/**
 * API service
 */
export const api = {
  // Events
  async getEvents(): Promise<EventType[]> {
    console.log('API: getEvents called');
    try {
      const result = await apiClient.get<EventType[]>('/api/admin/events');
      console.log('API: getEvents success', result.length, 'events');
      return result;
    } catch (error) {
      console.error('API: getEvents error', error);
      throw error;
    }
  },

  async getEventById(id: string): Promise<EventType> {
    return apiClient.get<EventType>(`/api/events/${id}`);
  },

  async createEvent(data: Partial<EventType>): Promise<EventType> {
    return apiClient.post<EventType>('/api/admin/events', data);
  },

  async updateEvent(id: string, data: Partial<EventType>): Promise<EventType> {
    return apiClient.patch<EventType>(`/api/admin/events/${id}`, data);
  },

  async deleteEvent(id: string): Promise<void> {
    return apiClient.del<void>(`/api/admin/events/${id}`);
  },

  async uploadEventImage(id: string, file: File): Promise<{ success: boolean; imageUrl: string; event: EventType }> {
    const formData = new FormData();
    formData.append('image', file);
    
    // Get auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type header, let fetch set it automatically for FormData
    
    const response = await fetch(`${env.apiUrl}/api/admin/events/${id}/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  },

  // Schedule/Itinerary
  async getSchedule(eventId: string): Promise<ItineraryItemType[]> {
    const response = await apiClient.get<{ data: any[] }>(`/api/events/${eventId}/schedule`);
    // Transform backend fields to frontend expected fields
    return response.data.map(item => ({
      ...item,
      startTime: item.start,
      endTime: item.end,
    }));
  },

  async createScheduleItem(eventId: string, data: Partial<ItineraryItemType>): Promise<ItineraryItemType> {
    // Transform frontend data to backend format
    const backendData = {
      title: data.title,
      location: data.location,
      notes: data.notes || data.description,
      color: data.color,
      allDay: data.allDay || false,
      start: data.startTime ? new Date(data.startTime).toISOString() : undefined,
      end: data.endTime ? new Date(data.endTime).toISOString() : undefined,
    };
    
    return apiClient.post<ItineraryItemType>(`/api/events/${eventId}/schedule`, backendData);
  },

  async updateScheduleItem(eventId: string, itemId: string, data: Partial<ItineraryItemType>): Promise<ItineraryItemType> {
    // Transform frontend data to backend format
    const backendData: any = {
      title: data.title,
      location: data.location,
      notes: data.notes || data.description,
      color: data.color,
      allDay: data.allDay,
    };
    
    // Only include start/end if they exist
    if (data.startTime) {
      backendData.start = new Date(data.startTime).toISOString();
    }
    if (data.endTime) {
      backendData.end = new Date(data.endTime).toISOString();
    }
    
    return apiClient.patch<ItineraryItemType>(`/api/events/${eventId}/schedule/${itemId}`, backendData);
  },

  async deleteScheduleItem(eventId: string, itemId: string): Promise<void> {
    return apiClient.del<void>(`/api/events/${eventId}/schedule/${itemId}`);
  },

  // Guests/Attendees
  async getGuests(eventId: string, filters?: any): Promise<AttendeeType[]> {
    return apiClient.get<AttendeeType[]>(`/api/events/${eventId}/invites`, { query: filters });
  },

  async getGuestById(eventId: string, guestId: string): Promise<AttendeeType> {
    return apiClient.get<AttendeeType>(`/api/events/${eventId}/invites/${guestId}`);
  },

  async createGuest(eventId: string, data: Partial<AttendeeType>): Promise<AttendeeType> {
    return apiClient.post<AttendeeType>(`/api/events/${eventId}/invites`, data);
  },

  async updateGuest(eventId: string, guestId: string, data: Partial<AttendeeType>): Promise<AttendeeType> {
    return apiClient.patch<AttendeeType>(`/api/events/${eventId}/invites/${guestId}`, data);
  },

  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    return apiClient.del<void>(`/api/events/${eventId}/invites/${guestId}`);
  },

  async importGuests(eventId: string, file: File): Promise<{ imported: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${env.apiUrl}/api/events/${eventId}/invites/import`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Import failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Messages
  async getMessages(eventId: string): Promise<MessageType[]> {
    const response = await apiClient.get<{ data: MessageType[] }>(`/api/events/${eventId}/messages`);
    return response.data || [];
  },

  async createMessage(eventId: string, data: any): Promise<MessageType> {
    return apiClient.post<MessageType>(`/api/events/${eventId}/messages`, data);
  },

  async sendMessage(eventId: string, data: { content: string; recipients: string[] }): Promise<MessageType> {
    return apiClient.post<MessageType>(`/api/events/${eventId}/messages`, data);
  },

  async updateMessage(eventId: string, messageId: string, data: any): Promise<MessageType> {
    return apiClient.patch<MessageType>(`/api/events/${eventId}/messages/${messageId}`, data);
  },

  async deleteMessage(eventId: string, messageId: string): Promise<void> {
    return apiClient.del<void>(`/api/events/${eventId}/messages/${messageId}`);
  },

  // Rooms
  async getRooms(eventId: string): Promise<RoomType[]> {
    return apiClient.get<RoomType[]>(`/api/events/${eventId}/rooms`);
  },

  async createRoom(eventId: string, data: Partial<RoomType>): Promise<RoomType> {
    return apiClient.post<RoomType>(`/api/events/${eventId}/rooms`, data);
  },

  async updateRoom(eventId: string, roomId: string, data: Partial<RoomType>): Promise<RoomType> {
    return apiClient.patch<RoomType>(`/api/events/${eventId}/rooms/${roomId}`, data);
  },

  async deleteRoom(eventId: string, roomId: string): Promise<void> {
    return apiClient.del<void>(`/api/events/${eventId}/rooms/${roomId}`);
  },

  async assignGuestToRoom(eventId: string, guestId: string, roomId: string): Promise<void> {
    return apiClient.post<void>(`/api/events/${eventId}/rooms/${roomId}/assign`, { guestId });
  },

  async unassignGuestFromRoom(eventId: string, guestId: string, roomId: string): Promise<void> {
    return apiClient.post<void>(`/api/events/${eventId}/rooms/${roomId}/unassign`, { guestId });
  },

  async uploadMessageAttachment(
    eventId: string,
    messageId: string,
    file: File
  ): Promise<{ success: boolean; fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_auth_token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${env.apiUrl}/api/events/${eventId}/messages/${messageId}/upload-attachments`,
      { method: 'POST', headers, body: formData }
    );
    
    if (!response.ok) {
      throw new Error('File upload failed');
    }
    
    return response.json();
  },

  // User
  async getCurrentUser(): Promise<UserType> {
    return apiClient.get<UserType>('/api/user');
  },
};