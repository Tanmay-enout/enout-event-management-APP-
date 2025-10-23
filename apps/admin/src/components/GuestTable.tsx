'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Download, Upload, Edit, Trash2, Search, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { AttendeeType, AttendeeStatusType } from '@enout/shared';
import { cn } from '@/lib/utils';
import { useCan } from '@/lib/useCan';
import { AttendeeDetailsModal } from './AttendeeDetailsModal';

const columnHelper = createColumnHelper<AttendeeType>();

function StatusBadge({ status }: { status: AttendeeStatusType }) {
  const variants = {
    invited: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    registered: 'bg-green-100 text-green-800',
  };

  return (
    <span className={cn(
      'inline-flex px-2 py-1 text-xs font-medium rounded-full',
      variants[status]
    )}>
      {status}
    </span>
  );
}

export function GuestTable({ eventId }: { eventId: string }) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [_selectedRows, _setSelectedRows] = useState<string[]>([]);
  const [_isEditing, _setIsEditing] = useState<string | null>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const canDelete = useCan('attendee.delete');
  const canEdit = useCan('attendee.edit');

  const { data: attendees = [], isLoading } = useQuery({
    queryKey: ['attendees', eventId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3003/api/events/${eventId}/invites?page=1&pageSize=100`);
      if (!response.ok) throw new Error('Failed to fetch guests');
      const data = await response.json();
      return data.data || [];
    },
  });

  const columns = [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <div className="font-medium text-gray-900">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor('firstName', {
      header: 'Name',
      cell: (info) => {
        const firstName = info.row.original.firstName;
        const lastName = info.row.original.lastName;
        return (
          <div>
            {firstName || lastName ? (
              <span>{firstName} {lastName}</span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => {
        const phone = info.getValue();
        const countryCode = info.row.original.countryCode;
        return phone ? (
          <span>{countryCode} {phone}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: 'details',
      header: 'Details',
      cell: ({ row }) => (
        <button
          onClick={() => {
            setSelectedAttendee(row.original);
            setIsDetailsModalOpen(true);
          }}
          className="p-1 text-gray-400 hover:text-primary transition-colors"
          title="View registration details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => _setIsEditing(row.original.id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => {
                // Delete logic would go here
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: attendees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleExport = () => {
    const csvData = attendees.map(attendee => ({
      email: attendee.email,
      firstName: attendee.firstName || '',
      lastName: attendee.lastName || '',
      phone: attendee.phone || '',
      status: attendee.status,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${eventId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search attendees..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {attendees.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-gray-900 mb-2">No attendees yet</div>
          <p className="text-gray-500 mb-4">
            Start by importing your guest list or adding attendees manually.
          </p>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Add Attendee
          </button>
        </div>
      )}

      {/* Attendee Details Modal */}
      <AttendeeDetailsModal
        isOpen={isDetailsModalOpen}
        attendee={selectedAttendee}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAttendee(null);
        }}
      />
    </div>
  );
}
