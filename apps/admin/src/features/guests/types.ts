import { z } from 'zod';

// Derived status types for guests
export const derivedStatusSchema = z.enum([
  'not_invited',
  'invited', 
  'email_verified',
  'accepted',
  'registered'
]);

export type DerivedStatus = z.infer<typeof derivedStatusSchema>;

// Guest type (extends the shared schema with derived status)
export const guestSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  countryCode: z.string().nullable(),
  derivedStatus: derivedStatusSchema,
  createdAt: z.string().datetime(),
  lastSentAt: z.string().datetime().nullable().optional(),
  acceptedAt: z.string().datetime().nullable().optional(),
  eventId: z.string(),
  // NEW: Registration form fields
  workEmail: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  dietaryRequirements: z.string().nullable().optional(),
  idDocUrl: z.string().nullable().optional(),
  phoneVerified: z.boolean().optional(),
});

export type Guest = z.infer<typeof guestSchema>;

// Paginated guests response
export const paginatedGuestsSchema = z.object({
  data: z.array(guestSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PaginatedGuests = z.infer<typeof paginatedGuestsSchema>;

// CSV import row schema
export const inviteRowSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  countryCode: z.string().optional().default('+1'),
});

export type InviteRow = z.infer<typeof inviteRowSchema>;

// Guest list filters
export const guestFiltersSchema = z.object({
  q: z.string().optional(),
  status: z.array(derivedStatusSchema).optional(),
  sort: z.enum(['newest', 'oldest', 'name_asc', 'name_desc', 'status']).optional(),
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});

export type GuestFilters = z.infer<typeof guestFiltersSchema>;

// Status chip colors mapping
export const statusColors = {
  not_invited: 'bg-gray-100 text-gray-800',
  invited: 'bg-blue-100 text-blue-800', 
  email_verified: 'bg-violet-100 text-violet-800',
  accepted: 'bg-amber-100 text-amber-800',
  registered: 'bg-green-100 text-green-800',
} as const;

// Sort options
export const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name_asc', label: 'Name A→Z' },
  { value: 'name_desc', label: 'Name Z→A' },
  { value: 'status', label: 'Status' },
] as const;

// Status filter options
export const statusOptions = [
  { value: 'not_invited', label: 'Not Invited' },
  { value: 'invited', label: 'Invited' },
  { value: 'email_verified', label: 'Email Verified' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'registered', label: 'Registered' },
] as const;
