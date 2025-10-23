'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Users, Home, X } from 'lucide-react';
import { api } from '@/lib/api';
import { RoomType, AttendeeType } from '@enout/shared';
import { cn } from '@/lib/utils';
import { StatusChip } from '@/components/rooms/StatusChip';

interface RoomGridProps {
  eventId: string;
}

function DraggableAttendee({ attendee }: { attendee: AttendeeType }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attendee.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-sm transition-shadow',
        isDragging && 'opacity-50'
      )}
    >
      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
        <span className="text-xs font-medium text-primary">
          {attendee.firstName?.[0] || attendee.email[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {attendee.firstName && attendee.lastName 
            ? `${attendee.firstName} ${attendee.lastName}`
            : attendee.email
          }
        </div>
        <div className="text-xs text-gray-500 truncate">{attendee.email}</div>
      </div>
    </div>
  );
}

function RoomCard({ room, assignedAttendees, onRemoveAttendee }: {
  room: RoomType;
  assignedAttendees: AttendeeType[];
  onRemoveAttendee: (attendeeId: string) => void;
}) {
  const roomCapacity = room.capacity || room.maxGuests;
  const isOverCapacity = assignedAttendees.length > roomCapacity;
  const occupancyPercentage = (assignedAttendees.length / roomCapacity) * 100;
  
  // Determine room status
  const getRoomStatus = (): 'Empty' | 'Partial' | 'Full' => {
    if (assignedAttendees.length === 0) return 'Empty';
    if (assignedAttendees.length === roomCapacity) return 'Full';
    return 'Partial';
  };

  const roomStatus = getRoomStatus();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">
              {room.name || `Room ${room.roomNo || room.id}`}
            </h3>
            <StatusChip status={roomStatus} />
          </div>
          <p className="text-sm text-gray-500">
            {room.hotel || room.category || 'Room'}
          </p>
        </div>
        <div className="text-right">
          <div className={cn(
            'text-sm font-medium',
            isOverCapacity ? 'text-red-600' : 'text-gray-900'
          )}>
            {assignedAttendees.length}/{roomCapacity}
          </div>
          <div className="text-xs text-gray-500">capacity</div>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              isOverCapacity 
                ? 'bg-red-500' 
                : occupancyPercentage > 80 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
            )}
            style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
          />
        </div>
        {isOverCapacity && (
          <p className="text-xs text-red-600 mt-1">Over capacity!</p>
        )}
      </div>

      {/* Amenities */}
      {room.amenities && room.amenities.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {room.amenities.map((amenity) => (
              <span
                key={amenity}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Attendees */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Users className="h-4 w-4" />
          Assigned ({assignedAttendees.length})
        </div>
        
        <SortableContext items={assignedAttendees.map(a => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[100px]">
            {assignedAttendees.map((attendee) => (
              <div key={attendee.id} className="relative group">
                <DraggableAttendee attendee={attendee} />
                <button
                  onClick={() => onRemoveAttendee(attendee.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function RoomGrid({ eventId }: RoomGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Use the new enhanced API
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/rooms`);
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      const data = await response.json();
      return data.rooms || data; // Handle both new and old response formats
    },
  });

  const { data: attendees = [], isLoading: attendeesLoading } = useQuery({
    queryKey: ['attendees', eventId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3003/api/events/${eventId}/invites?page=1&pageSize=100`);
      if (!response.ok) throw new Error('Failed to fetch guests');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Handle both new and old room data formats
  const rooms = Array.isArray(roomsData) ? roomsData : (roomsData?.rooms || []);

  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>(() => {
    const assignments: Record<string, string> = {};
    
    // Extract assignments from the new room data structure
    rooms.forEach(room => {
      if (room.assignments) {
        room.assignments.forEach(assignment => {
          assignments[assignment.attendeeId] = room.id;
        });
      }
    });
    
    // Also check legacy attendee data
    attendees.forEach(attendee => {
      if (attendee.roomId && !assignments[attendee.id]) {
        assignments[attendee.id] = attendee.roomId;
      }
    });
    
    return assignments;
  });

  const getAssignedAttendees = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    
    // If room has embedded assignments, use those
    if (room && room.assignments) {
      return room.assignments.map(assignment => ({
        id: assignment.attendeeId,
        firstName: assignment.attendee.firstName,
        lastName: assignment.attendee.lastName,
        email: assignment.attendee.email,
        roomId: roomId,
        eventId: eventId,
        phone: null,
        countryCode: null,
        status: 'accepted' as const,
        createdAt: '',
        updatedAt: '',
      }));
    }
    
    // Fallback to legacy attendee filtering
    return attendees.filter(attendee => roomAssignments[attendee.id] === roomId);
  };

  const getUnassignedAttendees = () => {
    // Get all assigned attendee IDs from rooms
    const assignedIds = new Set<string>();
    rooms.forEach(room => {
      if (room.assignments) {
        room.assignments.forEach(assignment => {
          assignedIds.add(assignment.attendeeId);
        });
      }
    });
    
    // Add legacy assignments
    Object.keys(roomAssignments).forEach(attendeeId => {
      assignedIds.add(attendeeId);
    });
    
    // Return attendees that are not assigned
    return attendees.filter(attendee => !assignedIds.has(attendee.id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const attendeeId = active.id as string;
    const roomId = over.id as string;

    // Check if dropping on a room
    if (rooms.some(room => room.id === roomId)) {
      const room = rooms.find(r => r.id === roomId);
      const currentAssignments = getAssignedAttendees(roomId);
      
      // Check capacity constraint
      const roomCapacity = room?.capacity || room?.maxGuests;
      if (room && roomCapacity && currentAssignments.length >= roomCapacity) {
        // Show toast or handle over capacity
        return;
      }

      setRoomAssignments(prev => ({
        ...prev,
        [attendeeId]: roomId,
      }));
    }
  };

  const handleRemoveAttendee = (attendeeId: string) => {
    setRoomAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[attendeeId];
      return newAssignments;
    });
  };

  if (roomsLoading || attendeesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Room Assignments</h2>
        <div className="text-sm text-gray-500">
          {attendees.length} total attendees
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="min-h-[200px]"
            >
              <RoomCard
                room={room}
                assignedAttendees={getAssignedAttendees(room.id)}
                onRemoveAttendee={handleRemoveAttendee}
              />
            </div>
          ))}
        </div>

        {/* Unassigned Attendees */}
        {getUnassignedAttendees().length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Unassigned Attendees</h3>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4 text-gray-600">
                <Home className="h-5 w-5" />
                <span className="font-medium">Drop attendees here to unassign</span>
              </div>
              
              <SortableContext items={getUnassignedAttendees().map(a => a.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getUnassignedAttendees().map((attendee) => (
                    <DraggableAttendee key={attendee.id} attendee={attendee} />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>
        )}

        <DragOverlay>
          {activeId ? (
            <DraggableAttendee 
              attendee={attendees.find(a => a.id === activeId)!} 
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {rooms.length === 0 && (
        <div className="text-center py-12">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
          <p className="text-gray-500 mb-4">
            Add rooms to start assigning attendees to accommodations.
          </p>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Add Room
          </button>
        </div>
      )}
    </div>
  );
}
