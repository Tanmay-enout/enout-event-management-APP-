'use client';

import { X, Download, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface AttendeeDetailsModalProps {
  isOpen: boolean;
  attendee: any;
  onClose: () => void;
}

export function AttendeeDetailsModal({
  isOpen,
  attendee,
  onClose,
}: AttendeeDetailsModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !attendee) return null;

  // Helper function to get full URL for uploaded files
  const getFileUrl = (relativePath: string): string => {
    if (!relativePath) return '';
    // If it's already a full URL, return as-is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    // Otherwise, prepend the API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
    return `${apiUrl}${relativePath}`;
  };

  const handleDownloadId = async () => {
    if (!attendee.idDocUrl) return;
    setIsDownloading(true);
    try {
      const fullUrl = getFileUrl(attendee.idDocUrl);
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = `${attendee.firstName || 'attendee'}_${attendee.lastName || 'id'}_document`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download ID:', error);
      alert('Failed to download ID document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewId = () => {
    if (attendee.idDocUrl) {
      const fullUrl = getFileUrl(attendee.idDocUrl);
      window.open(fullUrl, '_blank');
    }
  };

  // Check registration form completion
  const isFormComplete =
    attendee.firstName &&
    attendee.lastName &&
    attendee.workEmail &&
    attendee.location &&
    attendee.gender;

  // Check overall completion
  const isIdUploaded = attendee.idDocUrl && attendee.idDocUrl.trim() !== '';
  const isPhoneVerified = attendee.phoneVerified;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Registration Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium text-gray-900">
                  {attendee.firstName && attendee.lastName
                    ? `${attendee.firstName} ${attendee.lastName}`
                    : attendee.firstName || attendee.lastName || '—'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium text-gray-900">{attendee.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium text-gray-900">
                  {attendee.phone
                    ? `${attendee.countryCode || ''} ${attendee.phone}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Registration Form Data */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Registration Form</h3>
              {isFormComplete ? (
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Complete</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-600">Incomplete</span>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Work Email</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {attendee.workEmail || '—'}
                  </span>
                  {attendee.workEmail && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Location</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {attendee.location || '—'}
                  </span>
                  {attendee.location && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gender</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {attendee.gender || '—'}
                  </span>
                  {attendee.gender && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Dietary Requirements</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-right max-w-xs">
                    {attendee.dietaryRequirements || '—'}
                  </span>
                  {attendee.dietaryRequirements && (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ID Document */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">ID Document</h3>
              {isIdUploaded ? (
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Uploaded</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Not Uploaded</span>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              {isIdUploaded ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Document is ready for review</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleViewId}
                      className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      View ID
                    </button>
                    <button
                      onClick={handleDownloadId}
                      disabled={isDownloading}
                      className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="h-4 w-4" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No ID document uploaded yet</p>
              )}
            </div>
          </div>

          {/* Phone Verification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Phone Verification</h3>
              {isPhoneVerified ? (
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Not Verified</span>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                Status:{' '}
                <span
                  className={
                    isPhoneVerified
                      ? 'text-green-600 font-medium'
                      : 'text-gray-600 font-medium'
                  }
                >
                  {isPhoneVerified ? 'Verified via OTP' : 'Not verified'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
