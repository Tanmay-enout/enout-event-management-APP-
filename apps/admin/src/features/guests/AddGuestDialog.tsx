'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, UserPlus } from 'lucide-react';
import { InviteRow } from './types';

interface AddGuestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGuest: (guest: InviteRow) => void;
  isLoading: boolean;
}

const addGuestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  countryCode: z.string().optional().default('+1'),
});

type AddGuestFormData = z.infer<typeof addGuestSchema>;

export function AddGuestDialog({ isOpen, onClose, onAddGuest, isLoading }: AddGuestDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddGuestFormData>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: {
      countryCode: '+1',
    },
  });

  const onSubmit = (data: AddGuestFormData) => {
    onAddGuest(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        
        {/* Dialog */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Add Guest</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                {...register('firstName')}
                type="text"
                placeholder="Enter first name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                {...register('lastName')}
                type="text"
                placeholder="Enter last name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <div className="flex gap-2">
                <select
                  {...register('countryCode')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+33">+33</option>
                  <option value="+49">+49</option>
                  <option value="+81">+81</option>
                  <option value="+91">+91</option>
                </select>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="Enter phone number"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding...' : 'Add Guest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

