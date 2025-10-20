'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { api, calculateEventStatus } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { EventType } from '@enout/shared';

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  location: z.string().optional(),
  imageFile: z.any().optional(), // File input
});

type CreateEventForm = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated?: (event: EventType) => void;
}

export function CreateEventModal({ onClose, onEventCreated }: CreateEventModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      timezone: 'UTC',
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      // Calculate status based on dates
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const now = new Date();
      
      let status: 'pending' | 'in_progress' | 'complete';
      if (now < startDate) {
        status = 'pending';
      } else if (now > endDate) {
        status = 'complete';
      } else {
        status = 'in_progress';
      }
      
      // Create event without image first
      const response = await api.createEvent({
        name: data.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timezone: data.timezone,
        location: data.location || null,
        status: status,
      });
      
      // Upload image if provided
      if (selectedImageFile) {
        try {
          await api.uploadEventImage(response.id, selectedImageFile);
        } catch (uploadError) {
          console.warn('Failed to upload image, but event was created:', uploadError);
          // Don't fail the whole operation if image upload fails
        }
      }
      
      return response;
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', newEvent.id] });
      onEventCreated?.(newEvent);
      toast({
        title: 'Event created',
        description: `${newEvent.name} has been created successfully.`,
      });
      reset();
      setSelectedImageFile(null);
      onClose();
      router.push(`/events/${newEvent.id}/schedule`);
    },
    onError: (error) => {
      console.error('Failed to create event:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedImageFile(file);
  };

  const onSubmit = async (data: CreateEventForm) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Creating event with data:', data);
      await createEventMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Event</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              id="event-name"
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter event name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                {...register('startDate')}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                {...register('endDate')}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.endDate && (
                <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              {...register('timezone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Kolkata">India Standard Time</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
            {errors.timezone && (
              <p className="text-sm text-red-600 mt-1">{errors.timezone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location (Optional)
            </label>
            <input
              id="location"
              {...register('location')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter event location"
            />
          </div>

          <div>
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
              Event Image (Optional)
            </label>
            <input
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
            {selectedImageFile && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {selectedImageFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}