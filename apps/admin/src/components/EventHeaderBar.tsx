'use client';

import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useEventStore } from '@/lib/store';

interface EventHeaderBarProps {
  eventId: string;
}

export function EventHeaderBar({ eventId: _eventId }: EventHeaderBarProps) {
  const { selectedEvent } = useEventStore();

  if (!selectedEvent) {
    return (
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="text-gray-500">Loading event...</div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 border-b border-gray-200 bg-white">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        {selectedEvent.name}
      </h1>
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>
            {format(new Date(selectedEvent.startDate), 'MMM d, yyyy')} - 
            {' '}{format(new Date(selectedEvent.endDate), 'MMM d, yyyy')}
          </span>
        </div>
        {selectedEvent.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{selectedEvent.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{selectedEvent.timezone || 'Asia/Kolkata'}</span>
        </div>
      </div>
    </div>
  );
}