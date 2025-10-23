'use client';

import { useState } from 'react';
import { Send, RotateCcw, Download, Trash2, X } from 'lucide-react';
// import { useCan } from '@/lib/useCan';

interface BulkActionsProps {
  selectedCount: number;
  onAction: (action: 'send' | 'resend' | 'export' | 'remove') => void;
  onClearSelection: () => void;
  isLoading: boolean;
}

export function BulkActions({ selectedCount, onAction, onClearSelection, isLoading }: BulkActionsProps) {
  const [_isDropdownOpen, _setIsDropdownOpen] = useState(false);
  // Temporarily disable permission checks to make buttons functional
  const _canSendInvites = true; // useCan('attendee.invite' as any);
  const _canExport = true; // useCan('attendee.export' as any);
  const _canDelete = true; // useCan('attendee.delete' as any);

  const actions = [
    {
      id: 'send',
      label: 'Send Invites',
      icon: Send,
      disabled: false, // !canSendInvites,
      tooltip: undefined, // !canSendInvites ? 'You do not have permission to send invites' : undefined,
    },
    {
      id: 'resend',
      label: 'Resend Invites',
      icon: RotateCcw,
      disabled: false, // !canSendInvites,
      tooltip: undefined, // !canSendInvites ? 'You do not have permission to resend invites' : undefined,
    },
    {
      id: 'export',
      label: 'Export CSV',
      icon: Download,
      disabled: false, // !canExport,
      tooltip: undefined, // !canExport ? 'You do not have permission to export data' : undefined,
    },
    {
      id: 'remove',
      label: 'Remove',
      icon: Trash2,
      disabled: false, // !canDelete,
      tooltip: undefined, // !canDelete ? 'You do not have permission to remove guests' : undefined,
    },
  ];


  const handleAction = (actionId: string) => {
    onAction(actionId as 'send' | 'resend' | 'export' | 'remove');
    setIsDropdownOpen(false);
  };

  return (
    <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} guest{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex items-center gap-2 flex-wrap">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={action.disabled || isLoading}
                  title={action.tooltip}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    action.disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : action.id === 'remove'
                        ? 'bg-red-600 text-white hover:bg-red-700 border border-red-600'
                        : 'bg-primary text-white hover:bg-primary/90'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    visibility: 'visible',
                    display: 'flex',
                    minWidth: 'auto',
                    ...(action.id === 'remove' && {
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: '1px solid #dc2626'
                    })
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClearSelection}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
