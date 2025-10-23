'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, Search, Calendar, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEventStore } from '@/lib/store';
import { useEvents } from '@/lib/hooks';
import { CreateEventModal } from './CreateEventModal';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { selectedEventId, selectedEvent, setSelectedEventId, setSelectedEvent } = useEventStore();
  const { events } = useEvents();
  const { logout, email } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fallback events if API fails
  const fallbackEvents = [
    {
      id: 'event-1',
      name: 'Brevo Annual Off-site 2025',
      startDate: '2025-06-01T00:00:00.000Z',
      endDate: '2025-06-07T23:59:59.000Z',
      timezone: 'Asia/Kolkata',
      status: 'complete' as const,
      location: 'Holiday Inn Phuket',
    },
    {
      id: 'event-2',
      name: 'Q2 Team Building',
      startDate: '2025-04-15T00:00:00.000Z',
      endDate: '2025-04-17T23:59:59.000Z',
      timezone: 'America/New_York',
      status: 'complete' as const,
      location: 'Mountain Resort',
    },
    {
      id: 'event-3',
      name: 'Product Launch Event',
      startDate: '2025-02-10T00:00:00.000Z',
      endDate: '2025-02-10T23:59:59.000Z',
      timezone: 'Europe/London',
      status: 'complete' as const,
      location: 'Convention Center',
    },
  ];

  // Use fallback events if API fails or is loading
  const displayEvents = useMemo(() => {
    return events || fallbackEvents;
  }, [events]);

  // Auto-select the first event on first load
  useEffect(() => {
    if (displayEvents && displayEvents.length > 0 && !selectedEventId) {
      const firstEvent = displayEvents[0];
      setSelectedEventId(firstEvent.id);
      setSelectedEvent(firstEvent);
      
      // Navigate to the event's guests page
      if (pathname === '/events') {
        router.push(`/events/${firstEvent.id}/guests`);
      }
    }
  }, [displayEvents, selectedEventId, setSelectedEventId, setSelectedEvent, pathname, router]);

  // Update selectedEvent when selectedEventId changes
  useEffect(() => {
    if (selectedEventId && displayEvents) {
      const event = displayEvents.find(e => e.id === selectedEventId);
      if (event && (!selectedEvent || selectedEvent.id !== event.id)) {
        setSelectedEvent(event);
      }
    }
  }, [selectedEventId, displayEvents, selectedEvent, setSelectedEvent]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = displayEvents?.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      // Navigate to the selected event's current tab
      const pathParts = pathname.split('/');
      const currentTab = pathParts.length >= 4 ? pathParts[3] : 'guests';
      router.push(`/events/${eventId}/${currentTab}`);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      // Call API to delete the event from database
      await api.deleteEvent(eventId);
      
      // Show success toast
      toast({
        title: 'Event deleted',
        description: 'The event has been successfully deleted.',
      });

      // Invalidate the events query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // If the deleted event is currently selected, navigate away
      if (selectedEventId === eventId) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredEvents = displayEvents?.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const completedEvents = filteredEvents.filter(e => e.status === 'complete');
  const activeEvents = filteredEvents.filter(e => e.status !== 'complete');
  
  // Events filtered and categorized

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">My Events</h1>
        </div>

        {/* Search and Add */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Add New Event</span>
          </button>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Active Events */}
          {activeEvents.length > 0 && (
            <div className="space-y-2">
              {activeEvents.map((event) => (
                <div
                  key={event.id}
                  className={`group relative w-full text-left p-3 rounded-lg transition-colors ${
                    selectedEventId === event.id
                      ? 'bg-orange-50 border border-orange-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => handleEventSelect(event.id)}
                    className="w-full text-left pr-8"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {event.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(event.startDate), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {event.status === 'in_progress' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            active
                          </span>
                        )}
                        {event.status === 'pending' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventDelete(event.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 z-10"
                    title="Delete event"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Completed Events */}
          {completedEvents.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Complete
                </h2>
                <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {completedEvents.length}
                </span>
              </div>
              <div className="space-y-2">
                {completedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`group relative w-full text-left p-3 rounded-lg transition-colors ${
                      selectedEventId === event.id
                        ? 'bg-orange-50 border border-orange-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => handleEventSelect(event.id)}
                      className="w-full text-left pr-8"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {event.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500">
                              {format(new Date(event.startDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            complete
                          </span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventDelete(event.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 z-10"
                      title="Delete event"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No events found</p>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {email?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{email}</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <CreateEventModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}