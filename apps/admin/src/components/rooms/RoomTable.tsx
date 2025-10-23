'use client';

import { useState } from 'react';
import { Plus, User, X, Trash2, CheckSquare, Square } from 'lucide-react';
import { Room, AttendeeLite } from '@/features/rooms/api';
import { StatusChip } from './StatusChip';
import { GuestCellPicker } from './GuestCellPicker';
import { AddRoomDialog } from './AddRoomDialog';
import { ExportPdfButton } from './ExportPdfButton';
import { useAddRoom, useAssignRoom, useClearAssignment, useDeleteRooms } from '@/features/rooms/api';
import { cn } from '@/lib/utils';

interface RoomTableProps {
  rooms: Room[];
  eligibleAttendees: AttendeeLite[];
  eventId: string;
  isLoading: boolean;
}

export function RoomTable({ rooms, eligibleAttendees, eventId, isLoading }: RoomTableProps) {
  const [activePicker, setActivePicker] = useState<{ roomId: string; slot: 1 | 2 | 3 } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());

  const addRoomMutation = useAddRoom();
  const assignRoomMutation = useAssignRoom();
  const clearAssignmentMutation = useClearAssignment();
  const deleteRoomsMutation = useDeleteRooms();

  const getAttendeeForSlot = (room: Room, slot: 1 | 2 | 3): AttendeeLite | null => {
    const assignment = room.assignments.find(a => a.slot === slot);
    if (!assignment?.attendeeId) return null;
    if (!Array.isArray(eligibleAttendees)) return null;
    return eligibleAttendees.find(a => a.id === assignment.attendeeId) || null;
  };

  const handleAssignGuest = async (roomId: string, slot: 1 | 2 | 3, attendee: AttendeeLite | null) => {
    try {
      if (attendee) {
        await assignRoomMutation.mutateAsync({
          eventId,
          assignment: { roomId, slot, attendeeId: attendee.id },
        });
      } else {
        await clearAssignmentMutation.mutateAsync({
          eventId,
          assignment: { roomId, slot },
        });
      }
    } catch (error) {
      console.error('Failed to assign guest:', error);
    } finally {
      setActivePicker(null);
    }
  };

  const handleAddRoom = async (roomData: any) => {
    try {
      await addRoomMutation.mutateAsync({ eventId, room: roomData });
    } catch (error) {
      console.error('Failed to add room:', error);
      throw error;
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRooms.size === rooms.length) {
      setSelectedRooms(new Set());
    } else {
      setSelectedRooms(new Set(rooms.map(room => room.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRooms.size === 0) return;
    
    try {
      await deleteRoomsMutation.mutateAsync({ 
        eventId, 
        roomIds: Array.from(selectedRooms) 
      });
      setSelectedRooms(new Set());
    } catch (error) {
      console.error('Failed to delete rooms:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Rooms Detail</h3>
          <div className="flex items-center gap-3">
            {selectedRooms.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleteRoomsMutation.isPending}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedRooms.size})
              </button>
            )}
            <ExportPdfButton
              rooms={rooms}
              eligibleAttendees={eligibleAttendees}
              eventName={`Event ${eventId}`}
            />
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Room
            </button>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-500 mb-4">
              Add rooms to start managing room assignments.
            </p>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              Add Your First Room
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center w-5 h-5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {selectedRooms.size === rooms.length && rooms.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Max Guests</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Guest 1</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Guest 2</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Guest 3</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr 
                    key={room.id} 
                    className={cn(
                      "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                      selectedRooms.has(room.id) && "bg-blue-50"
                    )}
                  >
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleSelectRoom(room.id)}
                        className="flex items-center justify-center w-5 h-5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        {selectedRooms.has(room.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">Room {room.roomNo}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-700">{room.category}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-700">{room.maxGuests}</span>
                    </td>
                    
                    {/* Guest 1 */}
                    <td className="py-4 px-4">
                      <GuestCell
                        room={room}
                        slot={1}
                        attendee={getAttendeeForSlot(room, 1)}
                        isActive={activePicker?.roomId === room.id && activePicker?.slot === 1}
                        onActivate={() => setActivePicker({ roomId: room.id, slot: 1 })}
                        onAssign={(attendee) => handleAssignGuest(room.id, 1, attendee)}
                        isDisabled={room.maxGuests < 1}
                      />
                    </td>
                    
                    {/* Guest 2 */}
                    <td className="py-4 px-4">
                      <GuestCell
                        room={room}
                        slot={2}
                        attendee={getAttendeeForSlot(room, 2)}
                        isActive={activePicker?.roomId === room.id && activePicker?.slot === 2}
                        onActivate={() => setActivePicker({ roomId: room.id, slot: 2 })}
                        onAssign={(attendee) => handleAssignGuest(room.id, 2, attendee)}
                        isDisabled={room.maxGuests < 2}
                      />
                    </td>
                    
                    {/* Guest 3 */}
                    <td className="py-4 px-4">
                      <GuestCell
                        room={room}
                        slot={3}
                        attendee={getAttendeeForSlot(room, 3)}
                        isActive={activePicker?.roomId === room.id && activePicker?.slot === 3}
                        onActivate={() => setActivePicker({ roomId: room.id, slot: 3 })}
                        onAssign={(attendee) => handleAssignGuest(room.id, 3, attendee)}
                        isDisabled={room.maxGuests < 3}
                      />
                    </td>
                    
                    <td className="py-4 px-4">
                      <StatusChip status={room.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guest Picker */}
      {activePicker && (
        <div className="fixed inset-0 z-40" onClick={() => setActivePicker(null)}>
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
            <GuestCellPicker
              isOpen={true}
              onClose={() => setActivePicker(null)}
              onSelect={(attendee) => {
                const room = rooms.find(r => r.id === activePicker.roomId);
                if (room) {
                  handleAssignGuest(activePicker.roomId, activePicker.slot, attendee);
                }
              }}
              currentAttendee={getAttendeeForSlot(
                rooms.find(r => r.id === activePicker.roomId)!,
                activePicker.slot
              )}
              eligibleAttendees={eligibleAttendees}
              eventId={eventId}
              rooms={rooms}
            />
          </div>
        </div>
      )}

      {/* Add Room Dialog */}
      <AddRoomDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddRoom}
      />
    </>
  );
}

interface GuestCellProps {
  room: Room;
  slot: 1 | 2 | 3;
  attendee: AttendeeLite | null;
  isActive: boolean;
  onActivate: () => void;
  onAssign: (attendee: AttendeeLite | null) => void;
  isDisabled: boolean;
}

function GuestCell({ room: _room, slot: _slot, attendee, isActive, onActivate, onAssign, isDisabled }: GuestCellProps) {
  if (isDisabled) {
    return (
      <div className="text-gray-400 text-sm">
        —
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate();
          }
        }}
        className={cn(
          'w-full text-left p-2 rounded-lg border transition-colors',
          attendee
            ? 'border-green-200 bg-green-50 hover:bg-green-100'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100',
          isActive && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        {attendee ? (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900">
              {attendee.firstName} {attendee.lastName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {attendee.email}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Click to assign
          </div>
        )}
      </button>
      
      {attendee && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssign(null);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-label="Clear assignment"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
