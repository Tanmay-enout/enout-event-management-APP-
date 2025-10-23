'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Plus, User, Calendar, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CreateEventModal } from './CreateEventModal';
import { cn } from '@/lib/utils';
import { EventType, EventStatusType } from '@enout/shared';
import { useEventStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

function EventStatusChip({ status }: { status: EventStatusType }) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    complete: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={cn(
      'inline-flex px-2 py-1 text-xs font-medium rounded-full flex-shrink-0',
      variants[status]
    )}>
      {status.replace('_', ' ')}
    </span>
  );
}

function EventListItem({ 
  event, 
  isSelected, 
  onClick,
  onDelete,
  canDelete = false
}: { 
  event: EventType; 
  isSelected: boolean; 
  onClick: () => void;
  onDelete: (eventId: string) => void;
  canDelete?: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event selection when clicking delete
    setShowDeleteConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(event.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={cn(
        'w-full rounded-lg transition-colors border group relative',
        isSelected 
          ? 'bg-primary/10 border-primary/20' 
          : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
      )}
    >
      <button
        onClick={onClick}
        className="w-full text-left p-3"
      >
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1 min-w-0">
            {event.name}
          </h3>
          <div className="flex items-center gap-2">
            <EventStatusChip status={event.status} />
            {canDelete && (
              <button
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700"
                title="Delete event"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="truncate">
            {new Date(event.startDate).toLocaleDateString()}
          </span>
        </div>
      </button>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white border border-red-200 rounded-lg p-3 shadow-lg z-10">
          <div className="text-sm text-gray-900 mb-2">
            Delete &quot;{event.name}&quot;?
          </div>
          <div className="text-xs text-gray-500 mb-3">
            This action cannot be undone.
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmDelete}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={cancelDelete}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DrawerEventList() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localEvents, setLocalEvents] = useState<EventType[]>([]);
  
  const { selectedEventId: _selectedEventId, setSelectedEventId, setSelectedEvent } = useEventStore();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: () => {
      console.log('DrawerEventList - calling api.getEvents');
      return api.getEvents();
    },
    retry: false, // Don't retry if MSW fails
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  // Debug logging
  console.log('DrawerEventList - events:', events, 'isLoading:', isLoading, 'error:', error);

  // Fallback events if MSW fails
  const fallbackEvents = [
    {
      id: 'event-1',
      name: 'Brevo Annual Off-site 2025',
      startDate: '2025-01-15T09:00:00Z',
      endDate: '2025-01-17T18:00:00Z',
      timezone: 'Asia/Kolkata',
      status: 'in_progress' as const,
      location: 'Goa, India',
      _count: { attendees: 45, invites: 50, itineraryItems: 12 }
    },
    {
      id: 'event-2',
      name: 'Q2 Team Building',
      startDate: '2025-04-10T10:00:00Z',
      endDate: '2025-04-10T16:00:00Z',
      timezone: 'America/New_York',
      status: 'pending' as const,
      location: 'New York, NY',
      _count: { attendees: 0, invites: 25, itineraryItems: 6 }
    },
    {
      id: 'event-3',
      name: 'Product Launch Event',
      startDate: '2024-12-01T14:00:00Z',
      endDate: '2024-12-01T18:00:00Z',
      timezone: 'America/Los_Angeles',
      status: 'complete' as const,
      location: 'San Francisco, CA',
      _count: { attendees: 120, invites: 150, itineraryItems: 8 }
    }
  ];

  // Get created events from localStorage (where CreateEventModal stores them)
  const [createdEvents, setCreatedEvents] = useState<EventType[]>([]);

  React.useEffect(() => {
    // Get created events from localStorage
    const storedEvents = localStorage.getItem('createdEvents');
    if (storedEvents) {
      try {
        const parsedEvents = JSON.parse(storedEvents);
        console.log('DrawerEventList - Found created events in localStorage:', parsedEvents);
        setCreatedEvents(parsedEvents);
      } catch (error) {
        console.error('DrawerEventList - Error parsing created events:', error);
      }
    }
  }, []);

  // Combine real events with local events, created events, and fallback events
  const allEvents = [...events, ...localEvents, ...createdEvents];
  const displayEvents = allEvents.length > 0 ? allEvents : fallbackEvents;
  
  // Debug logging
  console.log('DrawerEventList - displayEvents:', displayEvents.length, 'events:', events.length, 'localEvents:', localEvents.length, 'createdEvents:', createdEvents.length, 'error:', error);
  console.log('DrawerEventList - using displayEvents:', displayEvents);
  console.log('DrawerEventList - filteredEvents:', filteredEvents.length);
  console.log('DrawerEventList - groupedEvents:', groupedEvents);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: api.getCurrentUser,
    retry: false,
  });

  // Fallback user if API fails
  const fallbackUser = {
    id: 'user-1',
    email: 'admin@enout.com',
    name: 'Admin User',
    role: 'admin' as const,
    avatar: null
  };

  const displayUser = user || fallbackUser;

  // Group events by status
  // Filter events by search query
  const filteredEvents = displayEvents.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.status]) {
      acc[event.status] = [];
    }
    acc[event.status].push(event);
    return acc;
  }, {} as Record<EventStatusType, EventType[]>);

  const handleEventSelect = (eventId: string) => {
    console.log('DrawerEventList - handleEventSelect called with eventId:', eventId);
    setSelectedEventId(eventId);
    // Find and set the selected event
    const event = displayEvents.find(e => e.id === eventId);
    console.log('DrawerEventList - found event:', event);
    if (event) {
      setSelectedEvent(event);
    }
    router.push(`/events/${eventId}/schedule`);
  };

  const handleEventCreated = (newEvent: EventType) => {
    // Add to local events if MSW is not working
    if (error) {
      setLocalEvents(prev => [...prev, newEvent]);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    console.log('DrawerEventList - Deleting event:', eventId);
    
    try {
      // Call API to delete the event from database
      await api.deleteEvent(eventId);
      console.log('DrawerEventList - Event deleted from API:', eventId);
      
      // Show success toast
      toast({
        title: 'Event deleted',
        description: 'The event has been successfully deleted.',
      });
      
      // Invalidate the events query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // Remove from localStorage (created events)
      const storedEvents = localStorage.getItem('createdEvents');
      if (storedEvents) {
        try {
          const parsedEvents = JSON.parse(storedEvents);
          const updatedEvents = parsedEvents.filter((event: EventType) => event.id !== eventId);
          localStorage.setItem('createdEvents', JSON.stringify(updatedEvents));
          console.log('DrawerEventList - Removed event from localStorage:', eventId);
          
          // Update local state
          setCreatedEvents(updatedEvents);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('createdEventsChanged'));
        } catch (error) {
          console.error('DrawerEventList - Error removing event from localStorage:', error);
        }
      }

      // Remove from local events if it exists there
      setLocalEvents(prev => prev.filter(event => event.id !== eventId));

      // If the deleted event is currently selected, navigate away
      if (currentEventId === eventId) {
        router.push('/');
      }
    } catch (error) {
      console.error('DrawerEventList - Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getSelectedEventId = () => {
    const match = pathname.match(/\/events\/([^/]+)/);
    return match ? match[1] : null;
  };

  const currentEventId = getSelectedEventId();

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900 mb-4">My Events</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Add New Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Event
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No events found</p>
            <p className="text-xs text-gray-400 mt-1">Try creating a new event</p>
          </div>
        ) : searchQuery ? (
          // Search results
          <div className="space-y-2">
            {filteredEvents.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                isSelected={currentEventId === event.id}
                onClick={() => handleEventSelect(event.id)}
                onDelete={handleEventDelete}
                canDelete={true}
              />
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No events found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        ) : (
          // Grouped by status
          <div className="space-y-6">
            {(['pending', 'in_progress', 'complete', 'draft'] as EventStatusType[]).map((status) => {
              const statusEvents = groupedEvents[status] || [];
              if (statusEvents.length === 0) return null;

              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-medium text-gray-700 capitalize">
                      {status.replace(/_/g, ' ')}
                    </h3>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {statusEvents.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {statusEvents.map((event: EventType) => (
                      <EventListItem
                        key={event.id}
                        event={event}
                        isSelected={currentEventId === event.id}
                        onClick={() => handleEventSelect(event.id)}
                        onDelete={handleEventDelete}
                        canDelete={true}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Card */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayUser.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {displayUser.role}
            </p>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateEventModal
          onClose={() => setIsCreateModalOpen(false)}
          onEventCreated={handleEventCreated}
        />
      )}
    </>
  );
}
