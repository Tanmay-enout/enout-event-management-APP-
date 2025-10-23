import { http, HttpResponse } from 'msw';
import { Room, RoomsResponse, AttendeeLite, RoomAssignmentResponse, AddRoomRequest, ClearAssignmentRequest } from './api';

// Mock data - Enhanced rooms with realistic names and assignments
const mockRooms: Room[] = [
  {
    id: 'room-1',
    eventId: 'event-1',
    roomNo: '1',
    category: 'Suite',
    maxGuests: 3,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    assignments: [
      { slot: 1, attendeeId: 'attendee-1' },
      { slot: 2, attendeeId: 'attendee-2' },
      { slot: 3, attendeeId: null },
    ],
    status: 'partial',
  },
  {
    id: 'room-2',
    eventId: 'event-1',
    roomNo: '2',
    category: 'Deluxe',
    maxGuests: 2,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    assignments: [
      { slot: 1, attendeeId: 'attendee-3' },
      { slot: 2, attendeeId: null },
    ],
    status: 'partial',
  },
  {
    id: 'room-3',
    eventId: 'event-1',
    roomNo: '3',
    category: 'Suite',
    maxGuests: 2,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    assignments: [
      { slot: 1, attendeeId: null },
      { slot: 2, attendeeId: null },
    ],
    status: 'empty',
  },
  {
    id: 'room-4',
    eventId: 'event-1',
    roomNo: '4',
    category: 'King',
    maxGuests: 2,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    assignments: [
      { slot: 1, attendeeId: 'attendee-4' },
      { slot: 2, attendeeId: 'attendee-5' },
    ],
    status: 'full',
  },
];

// Dynamic rooms storage for non-mock events
const dynamicRooms: Record<string, Room[]> = {};

// Track guest assignments across all events
const guestAssignments: Record<string, { roomId: string; slot: number }> = {};

// Note: mockEligibleAttendees removed - now using actual guest list data for all events

// Helper functions
function computeRoomStatus(room: Room): 'empty' | 'partial' | 'full' {
  const assignedCount = room.assignments.filter(a => a.attendeeId).length;
  if (assignedCount === 0) return 'empty';
  if (assignedCount === room.maxGuests) return 'full';
  return 'partial';
}

function filterRooms(rooms: Room[], filters: URLSearchParams): Room[] {
  // Compute status for each room dynamically
  const roomsWithComputedStatus = rooms.map(room => ({
    ...room,
    status: computeRoomStatus(room)
  }));
  
  let filtered = [...roomsWithComputedStatus];

  // Status filter
  const statusFilter = filters.getAll('status[]');
  if (statusFilter.length > 0) {
    filtered = filtered.filter(room => statusFilter.includes(room.status));
  }

  // Category filter
  const category = filters.get('category');
  if (category) {
    filtered = filtered.filter(room => room.category === category);
  }

  // Search filter
  const search = filters.get('q');
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(room => {
      // Search in room number and category
      if (room.roomNo.toLowerCase().includes(searchLower) ||
          room.category.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in assigned guest names and emails
      const assignedAttendeeIds = room.assignments
        .filter(a => a.attendeeId)
        .map(a => a.attendeeId);
      
      const assignedAttendees = mockEligibleAttendees.filter(a => 
        assignedAttendeeIds.includes(a.id)
      );
      
      return assignedAttendees.some(attendee =>
        attendee.firstName?.toLowerCase().includes(searchLower) ||
        attendee.lastName?.toLowerCase().includes(searchLower) ||
        attendee.email.toLowerCase().includes(searchLower) ||
        `${attendee.firstName} ${attendee.lastName}`.toLowerCase().includes(searchLower)
      );
    });
  }

  // Sort
  const sort = filters.get('sort');
  if (sort) {
    switch (sort) {
      case 'room-asc':
        filtered.sort((a, b) => a.roomNo.localeCompare(b.roomNo));
        break;
      case 'room-desc':
        filtered.sort((a, b) => b.roomNo.localeCompare(a.roomNo));
        break;
      case 'status': {
        const statusOrder = { 'empty': 0, 'partial': 1, 'full': 2 };
        filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
      }
      case 'newest':
      default:
        // Keep original order (newest first)
        break;
    }
  }

  return filtered;
}

function paginateRooms(rooms: Room[], page: number, pageSize: number) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return rooms.slice(startIndex, endIndex);
}

// Note: filterEligibleAttendees function removed - search filtering now handled by guest API

// MSW Handlers
export const roomsHandlers = [
  // GET /api/events/:id/rooms
  http.get('/api/events/:eventId/rooms', ({ request, params }) => {
    console.log('MSW: GET /api/events/:id/rooms called with params:', params);
    const eventId = params.eventId as string;
    const url = new URL(request.url);
    const filters = url.searchParams;
    const page = parseInt(filters.get('page') || '1', 10);
    const pageSize = parseInt(filters.get('pageSize') || '25', 10);

    // Handle both mock and dynamic events with consistent logic
    if (eventId === 'event-1') {
      console.log('MSW: Using enhanced rooms mock data with', mockRooms.length, 'rooms for mock event');
    } else {
      console.log('MSW: Returning rooms for dynamic event:', eventId);
    }
    
    console.log('MSW: Filters applied:', {
      status: filters.getAll('status[]'),
      category: filters.get('category'),
      search: filters.get('q'),
      sort: filters.get('sort'),
      page,
      pageSize
    });
    
    // Get the appropriate rooms array
    let eventRooms = eventId === 'event-1' ? mockRooms : (dynamicRooms[eventId] || []);
    
    // Update room assignments from global tracking for both mock and dynamic events
    eventRooms = eventRooms.map(room => {
      const updatedAssignments = room.assignments.map(assignment => {
        // Find if this slot has an assignment in global tracking
        const globalAssignment = Object.entries(guestAssignments).find(
          ([_, assignmentData]) => 
            assignmentData.roomId === room.id && assignmentData.slot === assignment.slot
        );
        
        return {
          ...assignment,
          attendeeId: globalAssignment ? globalAssignment[0] : assignment.attendeeId,
        };
      });
      
      return {
        ...room,
        assignments: updatedAssignments,
        status: computeRoomStatus({ ...room, assignments: updatedAssignments }),
      };
    });
    
    const filteredRooms = filterRooms(eventRooms, filters);
    console.log('MSW: Filtered rooms count:', filteredRooms.length);
    console.log('MSW: Room statuses:', filteredRooms.map(r => ({ roomNo: r.roomNo, status: r.status, assigned: r.assignments.filter(a => a.attendeeId).length, maxGuests: r.maxGuests })));
    
    const paginatedRooms = paginateRooms(filteredRooms, page, pageSize);
    const totalCount = filteredRooms.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    const response: RoomsResponse = {
      rooms: paginatedRooms,
      totalCount,
      page,
      pageSize,
      totalPages,
    };

    console.log('MSW: Returning', paginatedRooms.length, 'rooms out of', totalCount, 'total for event:', eventId);
    return HttpResponse.json(response);
  }),

  // GET /api/events/:id/attendees (eligible)
  http.get('/api/events/:eventId/attendees', async ({ request, params }) => {
    const eventId = params.eventId as string;
    const url = new URL(request.url);
    const search = url.searchParams.get('q');
    const statusFilter = url.searchParams.get('status');

    // Return eligible attendees for all events (both mock and dynamic)
    if (statusFilter === 'accepted,registered') {
      console.log('MSW: Returning eligible attendees for event:', eventId);
      
      // For ALL events (both mock and dynamic), fetch from the actual guest list
      try {
        // Import the guest API and mock DB directly to ensure consistency
        // const { guestsApi } = await import('@/features/guests/api');
        const { getMockDB } = await import('@/mocks/persistence');
        
        // Use the same approach as the guest list - direct mock DB access
        const mockDB = getMockDB();
        console.log('MSW: Direct mock DB access - guests count:', mockDB.guests.length);
        console.log('MSW: All guests in mock DB:', mockDB.guests);
        
        // Filter guests for this event
        const eventGuests = mockDB.guests.filter(guest => guest.eventId === eventId);
        console.log('MSW: Guests for event', eventId, ':', eventGuests.length);
        
        // Apply search filter if provided
        let filteredGuests = eventGuests;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredGuests = eventGuests.filter(guest =>
            guest.email.toLowerCase().includes(searchLower) ||
            guest.firstName?.toLowerCase().includes(searchLower) ||
            guest.lastName?.toLowerCase().includes(searchLower)
          );
        }
        
        // Log all guests and their statuses for debugging
        console.log('MSW: All guests for event:', filteredGuests.map(g => ({ 
          name: `${g.firstName} ${g.lastName}`, 
          status: g.derivedStatus,
          email: g.email 
        })));
        
        // Filter for eligible guests (accepted, registered, or email_verified)
        const eligibleGuests = filteredGuests.filter(guest => 
          ['accepted', 'registered', 'email_verified'].includes(guest.derivedStatus)
        );
        
        console.log('MSW: Eligible guests after filtering:', eligibleGuests.length);
        console.log('MSW: Eligible guest details:', eligibleGuests.map(g => ({ name: `${g.firstName} ${g.lastName}`, status: g.derivedStatus })));
        
        // For debugging: if Tanmay is not in eligible guests, show why
        const tanmayGuest = filteredGuests.find(g => 
          g.firstName?.toLowerCase().includes('tanmay') || 
          g.lastName?.toLowerCase().includes('tanmay') ||
          g.email?.toLowerCase().includes('tanmay')
        );
        if (tanmayGuest) {
          console.log('MSW: Found Tanmay guest:', tanmayGuest);
          console.log('MSW: Tanmay status:', tanmayGuest.derivedStatus);
          console.log('MSW: Is Tanmay eligible?', ['accepted', 'registered', 'email_verified'].includes(tanmayGuest.derivedStatus));
        } else {
          console.log('MSW: Tanmay guest not found in filtered guests');
        }
        
        // For debugging: temporarily use all guests to see if Tanmay appears
        // TODO: Remove this after debugging
        const guestsToUse = filteredGuests; // Use all guests for now
        console.log('MSW: Using all guests for debugging (including Tanmay if present)');
        
        // Original logic (commented out for debugging):
        // const guestsToUse = eligibleGuests.length > 0 ? eligibleGuests : filteredGuests;
        // if (eligibleGuests.length === 0) {
        //   console.log('MSW: No eligible guests found, using all guests for debugging');
        // }
        
        // Convert Guest format to AttendeeLite format
        const attendees: AttendeeLite[] = guestsToUse.map(guest => {
          // Check if this guest is already assigned to a room
          const assignment = guestAssignments[guest.id];
          let assigned = null;
          
          if (assignment) {
            // Find the room to get room number (check both mock and dynamic rooms)
            const rooms = eventId === 'event-1' ? mockRooms : (dynamicRooms[eventId] || []);
            const room = rooms.find(r => r.id === assignment.roomId);
            if (room) {
              assigned = {
                roomNo: room.roomNo,
                slot: assignment.slot as 1 | 2 | 3,
              };
            }
          }
          
          return {
            id: guest.id,
            eventId: guest.eventId,
            firstName: guest.firstName || '',
            lastName: guest.lastName || '',
            email: guest.email,
            status: guest.derivedStatus === 'accepted' ? 'accepted' : 'registered',
            assigned,
          };
        });
        
        console.log('MSW: Converted to eligible attendees:', attendees.length);
        return HttpResponse.json(attendees);
      } catch (error) {
        console.error('MSW: Error fetching guests for event:', eventId, error);
        
        // Return empty array if guest list fetch fails for any event
        console.log('MSW: Returning empty attendees due to guest list fetch error');
        return HttpResponse.json([]);
      }
    }

    // Return empty array for other status filters
    console.log('MSW: Returning empty eligible attendees for status filter:', statusFilter);
    return HttpResponse.json([]);
  }),

  // POST /api/events/:id/rooms (add room)
  http.post('/api/events/:eventId/rooms', async ({ request, params }) => {
    const eventId = params.eventId as string;
    const body = await request.json() as AddRoomRequest;
    
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      eventId,
      roomNo: body.roomNo,
      category: body.category,
      maxGuests: body.maxGuests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignments: [
        { slot: 1, attendeeId: null },
        { slot: 2, attendeeId: null },
        { slot: 3, attendeeId: null },
      ].slice(0, body.maxGuests),
      status: 'empty',
    };

    // Store the room in appropriate storage
    if (eventId === 'event-1') {
      // For mock event, add to mock rooms
      mockRooms.push(newRoom);
      console.log('MSW: Added room to mock event, total rooms:', mockRooms.length);
    } else {
      // For dynamic events, add to dynamic storage
      if (!dynamicRooms[eventId]) {
        dynamicRooms[eventId] = [];
      }
      dynamicRooms[eventId].push(newRoom);
      console.log('MSW: Added room to dynamic event:', eventId, 'total rooms:', dynamicRooms[eventId].length);
    }

    console.log('MSW: Adding new room for event:', eventId, newRoom);
    return HttpResponse.json(newRoom, { status: 201 });
  }),

  // POST /api/events/:id/rooms/clear (clear assignment)
  http.post('/api/events/:eventId/rooms/clear', async ({ request, params }) => {
    const eventId = params.eventId as string;
    const body = await request.json() as ClearAssignmentRequest;
    
    console.log('MSW: Clearing assignment for event:', eventId, body);
    
    // Get the appropriate rooms array
    const rooms = eventId === 'event-1' ? mockRooms : (dynamicRooms[eventId] || []);
    
    // Find the room and clear the assignment
    const room = rooms.find(r => r.id === body.roomId);
    if (room) {
      const assignmentIndex = room.assignments.findIndex(a => a.slot === body.slot);
      if (assignmentIndex !== -1) {
        const attendeeId = room.assignments[assignmentIndex].attendeeId;
        
        // Clear the assignment
        room.assignments[assignmentIndex].attendeeId = null;
        room.status = computeRoomStatus(room);
        room.updatedAt = new Date().toISOString();
        
        // Remove from global tracking
        if (attendeeId) {
          delete guestAssignments[attendeeId];
        }
      }
    }
    
    return HttpResponse.json({ success: true });
  }),

  // POST /api/events/:id/rooms/assign
  http.post('/api/events/:eventId/rooms/assign', async ({ request, params }) => {
    const eventId = params.eventId as string;
    const body = await request.json() as { roomId: string; slot: number; attendeeId: string | null };
    
    console.log('MSW: Room assignment request for event:', eventId, body);
    
    // Get the appropriate rooms array
    const rooms = eventId === 'event-1' ? mockRooms : (dynamicRooms[eventId] || []);
    
    // Find the room to assign to
    const room = rooms.find(r => r.id === body.roomId);
    if (!room) {
      return HttpResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }
    
    // Check if attendee is already assigned to another room
    if (body.attendeeId) {
      const existingAssignment = guestAssignments[body.attendeeId];
      
      if (existingAssignment && existingAssignment.roomId !== body.roomId) {
        const response: RoomAssignmentResponse = {
          success: false,
          alreadyAssigned: {
            roomId: existingAssignment.roomId,
            slot: existingAssignment.slot,
          },
        };
        return HttpResponse.json(response, { status: 400 });
      }
    }
    
    // Update the assignment in the room
    const assignmentIndex = room.assignments.findIndex(a => a.slot === body.slot);
    if (assignmentIndex !== -1) {
      // Clear previous assignment if any
      const previousAttendeeId = room.assignments[assignmentIndex].attendeeId;
      if (previousAttendeeId) {
        delete guestAssignments[previousAttendeeId];
      }
      
      // Set new assignment
      room.assignments[assignmentIndex].attendeeId = body.attendeeId;
      room.status = computeRoomStatus(room);
      room.updatedAt = new Date().toISOString();
      
      // Track the assignment globally
      if (body.attendeeId) {
        guestAssignments[body.attendeeId] = {
          roomId: body.roomId,
          slot: body.slot,
        };
      }
    }

    // Simulate successful assignment
    const response: RoomAssignmentResponse = {
      success: true,
    };

    console.log('MSW: Room assignment successful for event:', eventId);
    return HttpResponse.json(response);
  }),


  // GET /api/events/:id/rooms/export
  http.get('/api/events/:eventId/rooms/export', ({ request, params }) => {
    const eventId = params.eventId as string;
    const url = new URL(request.url);
    const filters = url.searchParams;
    
    // Get the appropriate rooms array
    const rooms = eventId === 'event-1' ? mockRooms : (dynamicRooms[eventId] || []);
    const filteredRooms = filterRooms(rooms, filters);
    
    // Generate CSV content
    const csvHeader = 'roomNo,category,maxGuests,assignedIds\n';
    const csvRows = filteredRooms.map(room => {
      const assignedIds = room.assignments.map(a => a.attendeeId).join(';');
      return `${room.roomNo},${room.category},${room.maxGuests},"${assignedIds}"`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    console.log('MSW: Exporting', filteredRooms.length, 'rooms for event:', eventId);
    return new HttpResponse(blob, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="rooms_export.csv"',
      },
    });
  }),

  // POST /api/events/:id/rooms/delete
  http.post('/api/events/:eventId/rooms/delete', async ({ request, params }) => {
    const eventId = params.eventId as string;
    const body = await request.json() as { roomIds: string[] };
    
    console.log('MSW: Deleting rooms for event:', eventId, 'roomIds:', body.roomIds);
    
    // Get the appropriate rooms array
    if (eventId === 'event-1') {
      // Remove rooms from mock rooms
      const initialLength = mockRooms.length;
      mockRooms.splice(0, mockRooms.length, ...mockRooms.filter(room => !body.roomIds.includes(room.id)));
      console.log('MSW: Deleted', initialLength - mockRooms.length, 'rooms from mock event');
    } else {
      // Remove rooms from dynamic rooms
      if (dynamicRooms[eventId]) {
        const initialLength = dynamicRooms[eventId].length;
        dynamicRooms[eventId] = dynamicRooms[eventId].filter(room => !body.roomIds.includes(room.id));
        console.log('MSW: Deleted', initialLength - dynamicRooms[eventId].length, 'rooms from dynamic event');
      }
    }
    
    // Clear any guest assignments for deleted rooms
    body.roomIds.forEach(roomId => {
      Object.keys(guestAssignments).forEach(guestId => {
        if (guestAssignments[guestId].roomId === roomId) {
          delete guestAssignments[guestId];
        }
      });
    });
    
    console.log('MSW: Room deletion successful for event:', eventId);
    return HttpResponse.json({ success: true, deleted: body.roomIds.length });
  }),
];
