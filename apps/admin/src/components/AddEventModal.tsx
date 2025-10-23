'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, Palette } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const addEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  color: z.string().min(1, 'Color is required'),
});

type AddEventForm = z.infer<typeof addEventSchema>;

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedHour?: number;
  eventId: string;
}

const EVENT_COLORS = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-100', border: 'border-blue-200' },
  { name: 'Green', value: '#10B981', bg: 'bg-green-100', border: 'border-green-200' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-100', border: 'border-purple-200' },
  { name: 'Orange', value: '#F59E0B', bg: 'bg-orange-100', border: 'border-orange-200' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-100', border: 'border-red-200' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-100', border: 'border-pink-200' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-100', border: 'border-indigo-200' },
  { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-100', border: 'border-teal-200' },
];

export function AddEventModal({ isOpen, onClose, selectedDate, selectedHour, eventId }: AddEventModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultStartTime = selectedHour !== undefined 
    ? format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedHour, 0, 0), "yyyy-MM-dd'T'HH:mm")
    : format(selectedDate, "yyyy-MM-dd'T'HH:mm");

  const defaultEndTime = selectedHour !== undefined
    ? format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedHour + 1, 0, 0), "yyyy-MM-dd'T'HH:mm")
    : format(new Date(selectedDate.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AddEventForm>({
    resolver: zodResolver(addEventSchema),
    defaultValues: {
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      color: EVENT_COLORS[0].value,
    },
  });

  const selectedColor = watch('color');

  const createEventMutation = useMutation({
    mutationFn: async (data: AddEventForm) => {
      return api.createScheduleItem(eventId, {
        title: data.title,
        description: data.description || '',
        startTime: data.startTime,
        endTime: data.endTime,
        color: data.color,
        location: null,
        type: 'meeting',
        order: 0,
      });
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', eventId] });
      toast({
        title: 'Event created',
        description: `${newEvent.title} has been added to your schedule.`,
      });
      reset();
      onClose();
    },
    onError: (_error) => {
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: AddEventForm) => {
    setIsSubmitting(true);
    try {
      await createEventMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Event</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="title"
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter event description (optional)"
            />
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time *
              </label>
              <input
                id="startTime"
                {...register('startTime')}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time *
              </label>
              <input
                id="endTime"
                {...register('endTime')}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="h-4 w-4 inline mr-1" />
              Color *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setValue('color', color.value)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all hover:scale-105
                    ${selectedColor === color.value 
                      ? `${color.border} border-2` 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div 
                    className="w-full h-6 rounded"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="text-xs text-gray-600 mt-1">{color.name}</div>
                  {selectedColor === color.value && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-600 rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.color && (
              <p className="text-sm text-red-600 mt-1">{errors.color.message}</p>
            )}
          </div>

          {/* Selected Date Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                {selectedHour !== undefined && ` at ${selectedHour}:00`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
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
