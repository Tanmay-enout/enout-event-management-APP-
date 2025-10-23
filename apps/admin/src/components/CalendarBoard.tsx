'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { api } from '@/lib/api';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { AddEventModal } from './AddEventModal';
import { toast } from '@/hooks/use-toast';

interface CalendarBoardProps {
  eventId: string;
}

type ViewMode = 'week' | 'day' | 'month';

// Event Item Component with delete functionality
const EventItem = React.memo(function EventItem({ 
  event, 
  eventId: _eventId, 
  onDelete 
}: { 
  event: any; 
  eventId: string; 
  onDelete: (itemId: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('EventItem: Delete button clicked for event:', event.id, 'title:', event.title);
    onDelete(event.id);
  }, [event.id, event.title, onDelete]);

  return (
    <div
      className="absolute top-0 left-1 right-1 rounded-lg p-2 cursor-move transition-colors group"
      style={{ 
        height: `${(new Date(event.endTime).getHours() - new Date(event.startTime).getHours()) * 48}px`,
        backgroundColor: event.color ? `${event.color}20` : '#F9B24E20',
        borderColor: event.color || '#F9B24E',
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">
            {event.title}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
          </div>
          {event.location && (
            <div className="text-xs text-gray-500 truncate">
              📍 {event.location}
            </div>
          )}
        </div>
        
        {/* Delete Button - appears on hover */}
        {isHovered && (
          <button
            onClick={(e) => {
              console.log('EventItem: Delete button clicked, event.id:', event.id);
              handleDelete(e);
            }}
            className="ml-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors opacity-80 hover:opacity-100"
            title="Delete event"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});

// Day View Component
function DayView({ currentDate, schedule, onCellClick, onDeleteEvent, eventId }: { currentDate: Date; schedule: any[]; onCellClick: (date: Date, hour: number) => void; onDeleteEvent: (itemId: string) => void; eventId: string }) {
  const timeSlots = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  
  const getEventsForTimeSlot = useCallback((hour: number) => {
    return schedule.filter(item => {
      const eventStart = new Date(item.startTime);
      const eventEnd = new Date(item.endTime);
      return isSameDay(eventStart, currentDate) && 
             eventStart.getHours() <= hour && 
             eventEnd.getHours() > hour;
    });
  }, [schedule, currentDate]);

  return (
    <>
      {/* Header */}
      <div className="grid grid-cols-2 border-b border-gray-200">
        <div className="p-3 text-sm font-medium text-gray-500 border-r border-gray-200">
          Time
        </div>
        <div className="p-3 text-center">
          <div className="text-sm font-medium text-gray-900">
            {format(currentDate, 'EEEE')}
          </div>
          <div className={cn(
            'text-lg font-semibold mt-1',
            isToday(currentDate) ? 'text-primary' : 'text-gray-700'
          )}>
            {format(currentDate, 'd')}
          </div>
        </div>
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-2">
        {/* Time Column */}
        <div className="border-r border-gray-200">
          {timeSlots.map((hour) => (
            <div key={hour} className="h-12 border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-gray-500">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        {/* Day Column */}
        <div>
          {timeSlots.map((hour) => (
            <div 
              key={hour} 
              className="h-12 border-b border-gray-100 relative cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onCellClick(currentDate, hour)}
            >
              {getEventsForTimeSlot(hour).map((event) => {
                const startHour = new Date(event.startTime).getHours();
                
                if (hour === startHour) {
                  return (
                    <EventItem
                      key={event.id}
                      event={event}
                      eventId={eventId}
                      onDelete={onDeleteEvent}
                    />
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Week View Component
function WeekView({ currentDate, schedule, onCellClick, onDeleteEvent, eventId }: { currentDate: Date; schedule: any[]; onCellClick: (date: Date, hour: number) => void; onDeleteEvent: (itemId: string) => void; eventId: string }) {
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const timeSlots = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const getEventsForDay = useCallback((date: Date) => {
    return schedule.filter(item => 
      isSameDay(new Date(item.startTime), date)
    );
  }, [schedule]);

  return (
    <>
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-3 text-sm font-medium text-gray-500 border-r border-gray-200">
          Time
        </div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-3 text-center border-r border-gray-200 last:border-r-0">
            <div className="text-sm font-medium text-gray-900">
              {format(day, 'EEE')}
            </div>
            <div className={cn(
              'text-lg font-semibold mt-1',
              isSameDay(day, new Date()) 
                ? 'text-primary' 
                : 'text-gray-700'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-8">
        {/* Time Column */}
        <div className="border-r border-gray-200">
          {timeSlots.map((hour) => (
            <div key={hour} className="h-12 border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-gray-500">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="border-r border-gray-200 last:border-r-0">
            {timeSlots.map((hour) => (
              <div 
                key={hour} 
                className="h-12 border-b border-gray-100 relative cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onCellClick(day, hour)}
              >
                {/* Event Items */}
                {getEventsForDay(day).map((event) => {
                  const startHour = new Date(event.startTime).getHours();
                  
                  if (hour === startHour) {
                    return (
                      <EventItem
                        key={event.id}
                        event={event}
                        eventId={eventId}
                        onDelete={onDeleteEvent}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// Month View Component
function MonthView({ currentDate, schedule, onCellClick, onDeleteEvent }: { currentDate: Date; schedule: any[]; onCellClick: (date: Date) => void; onDeleteEvent: (itemId: string) => void }) {
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const startDate = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart]);
  const endDate = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd]);
  const monthDays = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const getEventsForDay = useCallback((date: Date) => {
    return schedule.filter(item => 
      isSameDay(new Date(item.startTime), date)
    );
  }, [schedule]);

  return (
    <>
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="p-3 text-center border-r border-gray-200 last:border-r-0">
            <div className="text-sm font-medium text-gray-500">{day}</div>
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7">
        {monthDays.map((day) => (
          <div 
            key={day.toISOString()} 
            className={cn(
              'min-h-[120px] border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors',
              !isSameMonth(day, currentDate) && 'bg-gray-50',
              isToday(day) && 'bg-primary/5'
            )}
            onClick={() => onCellClick(day)}
          >
            <div className={cn(
              'text-sm font-medium mb-1',
              isToday(day) ? 'text-primary' : 'text-gray-700'
            )}>
              {format(day, 'd')}
            </div>
            
            {/* Events for this day */}
            <div className="space-y-1">
              {getEventsForDay(day).slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors group relative"
                  style={{
                    backgroundColor: event.color ? `${event.color}20` : '#F9B24E20',
                    color: event.color || '#F9B24E'
                  }}
                  title={`${event.title} - ${format(new Date(event.startTime), 'h:mm a')}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">
                      {format(new Date(event.startTime), 'h:mm')} {event.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('MonthView: Delete button clicked for event:', event.id, 'title:', event.title);
                        onDeleteEvent(event.id);
                      }}
                      className="ml-1 p-0.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete event"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                </div>
              ))}
              {getEventsForDay(day).length > 3 && (
                <div className="text-xs text-gray-500">
                  +{getEventsForDay(day).length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function CalendarBoard({ eventId }: CalendarBoardProps) {
  console.log('CalendarBoard: Component rendered with eventId:', eventId);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: schedule = [], isLoading, error } = useQuery({
    queryKey: ['schedule', eventId],
    queryFn: () => api.getSchedule(eventId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    retryDelay: 1000,
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (itemId: string) => {
      console.log('CalendarBoard: deleteEventMutation called with itemId:', itemId, 'eventId:', eventId);
      try {
        console.log('CalendarBoard: About to call api.deleteScheduleItem');
        const result = await api.deleteScheduleItem(eventId, itemId);
        console.log('CalendarBoard: api.deleteScheduleItem completed with result:', result);
        return result;
      } catch (error) {
        console.error('CalendarBoard: Error in api.deleteScheduleItem:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('CalendarBoard: Delete mutation successful');
      queryClient.invalidateQueries({ queryKey: ['schedule', eventId] });
      toast({
        title: 'Event deleted',
        description: 'The event has been removed from your schedule.',
      });
    },
    onError: (error) => {
      console.error('CalendarBoard: Delete mutation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteEvent = (itemId: string) => {
    console.log('CalendarBoard: handleDeleteEvent called with itemId:', itemId);
    console.log('CalendarBoard: About to call deleteEventMutation.mutate');
    deleteEventMutation.mutate(itemId);
    console.log('CalendarBoard: deleteEventMutation.mutate called');
  };

  // Memoize expensive date calculations
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const _weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const _timeSlots = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  // Memoize event filtering functions
  const _getEventsForDay = useCallback((date: Date) => {
    return schedule.filter(item => 
      isSameDay(new Date(item.startTime), date)
    );
  }, [schedule]);

  const _getEventsForTimeSlot = useCallback((date: Date, hour: number) => {
    return schedule.filter(item => {
      const eventStart = new Date(item.startTime);
      const eventEnd = new Date(item.endTime);
      return isSameDay(eventStart, date) && 
             eventStart.getHours() <= hour && 
             eventEnd.getHours() > hour;
    });
  }, [schedule]);

  // Memoize view title calculation
  const viewTitle = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      default:
        return '';
    }
  }, [viewMode, currentDate, weekStart]);

  // Memoize navigation functions
  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day':
          return direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1);
        case 'week':
          return direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
        case 'month':
          return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
        default:
          return prev;
      }
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleCellClick = useCallback((date: Date, hour?: number) => {
    setSelectedDate(date);
    setSelectedHour(hour);
    setIsAddEventModalOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-lg font-medium text-red-600 mb-2">Error loading schedule</div>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {viewTitle}
            </h2>
            
            <button
              onClick={() => navigate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['week', 'day', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                viewMode === mode
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {viewMode === 'day' && <DayView currentDate={currentDate} schedule={schedule} onCellClick={handleCellClick} onDeleteEvent={handleDeleteEvent} eventId={eventId} />}
        {viewMode === 'week' && <WeekView currentDate={currentDate} schedule={schedule} onCellClick={handleCellClick} onDeleteEvent={handleDeleteEvent} eventId={eventId} />}
        {viewMode === 'month' && <MonthView currentDate={currentDate} schedule={schedule} onCellClick={(date) => handleCellClick(date)} onDeleteEvent={handleDeleteEvent} />}
      </div>

      {/* Empty State */}
      {schedule.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
          <p className="text-gray-500 mb-4">
            Start building your event schedule by adding itinerary items.
          </p>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Add Event
          </button>
        </div>
      )}

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        eventId={eventId}
      />
    </div>
  );
}
