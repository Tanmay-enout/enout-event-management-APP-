'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Guest } from './types';
import { guestsApi } from './api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const editGuestSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().nullable().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
});

type EditGuestFormData = z.infer<typeof editGuestSchema>;

interface EditGuestModalProps {
  guest: Guest | null;
  eventId: string;
  onClose: () => void;
}

const countryOptions = [
  { value: '+1', label: '+1 (US/Canada)' },
  { value: '+44', label: '+44 (UK)' },
  { value: '+33', label: '+33 (France)' },
  { value: '+49', label: '+49 (Germany)' },
  { value: '+81', label: '+81 (Japan)' },
  { value: '+91', label: '+91 (India)' },
  { value: '+86', label: '+86 (China)' },
  { value: '+61', label: '+61 (Australia)' },
];

export function EditGuestModal({ guest, eventId, onClose }: EditGuestModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditGuestFormData>({
    resolver: zodResolver(editGuestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: '+1',
    },
  });

  // Reset form when guest changes
  useEffect(() => {
    if (guest) {
      reset({
        firstName: guest.firstName || '',
        lastName: guest.lastName || '',
        email: guest.email,
        phone: guest.phone || '',
        countryCode: guest.countryCode || '+1',
      });
    }
  }, [guest, reset]);

  const updateGuestMutation = useMutation({
    mutationFn: (data: EditGuestFormData) => {
      if (!guest) throw new Error('No guest selected');
      return guestsApi.updateGuest(eventId, guest.id, data);
    },
    onSuccess: () => {
      toast({
        title: 'Guest updated',
        description: 'Guest details updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update guest',
        description: error.message || 'Failed to update guest details',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EditGuestFormData) => {
    updateGuestMutation.mutate(data);
  };

  if (!guest) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div 
        className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Guest</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              {...register('firstName')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              {...register('lastName')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Country Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country Code
            </label>
            <select
              {...register('countryCode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.countryCode && (
              <p className="text-red-500 text-sm mt-1">{errors.countryCode.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateGuestMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateGuestMutation.isPending ? 'Updating...' : 'Update Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

