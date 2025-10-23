'use client';

import { Edit } from 'lucide-react';
import { Guest } from '../types';
// import { useCan } from '@/lib/useCan';

interface RowActionsProps {
  guest: Guest;
  onSendInvite: () => void;
  onResendInvite: () => void;
  onDelete: () => void;
  canDelete: boolean;
  canEdit: boolean;
  canSendInvites: boolean;
  isLoading: boolean;
  onEdit: (guest: Guest) => void;
}

export function RowActions({
  guest,
  onSendInvite: _onSendInvite,
  onResendInvite: _onResendInvite,
  onDelete: _onDelete,
  canDelete: _canDelete,
  canEdit: _canEdit,
  canSendInvites: _canSendInvites,
  isLoading,
  onEdit,
}: RowActionsProps) {
  return (
    <button
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-lg ${
        isLoading
          ? 'text-gray-400 cursor-not-allowed opacity-50'
          : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(guest);
      }}
    >
      <Edit className="h-4 w-4" />
      Edit
    </button>
  );
}
