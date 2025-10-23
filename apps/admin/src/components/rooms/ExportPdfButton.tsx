'use client';

import { Download } from 'lucide-react';
import { Room, AttendeeLite } from '@/features/rooms/api';
import { generateRoomingPlanPDF } from '@/lib/pdf-generator';
import { useState } from 'react';

interface ExportPdfButtonProps {
  rooms: Room[];
  eligibleAttendees: AttendeeLite[];
  eventName?: string;
  disabled?: boolean;
}

export function ExportPdfButton({
  rooms,
  eligibleAttendees,
  eventName = 'Event',
  disabled = false,
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    // Don't export if no rooms
    if (rooms.length === 0) {
      alert('No rooms to export. Please add rooms first.');
      return;
    }

    setIsExporting(true);
    try {
      await generateRoomingPlanPDF(rooms, eligibleAttendees, eventName);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting || rooms.length === 0}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={rooms.length === 0 ? 'Add rooms first to export' : 'Export rooming plan as PDF'}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export PDF
        </>
      )}
    </button>
  );
}
