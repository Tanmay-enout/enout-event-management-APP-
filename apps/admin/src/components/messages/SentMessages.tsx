'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Mail, Users, Clock, CheckCircle, X, Eye } from 'lucide-react';

interface SentMessagesProps {
  eventId: string;
}

export function SentMessages({ eventId }: SentMessagesProps) {
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['messages', eventId],
    queryFn: () => api.getMessages(eventId),
    select: (data) => {
      const sentMessages = data.filter((msg: any) => msg.status === 'sent');
      
      // Group messages by title and body to avoid duplication
      const groupedMessages = new Map();
      
      sentMessages.forEach((msg: any) => {
        const key = `${msg.title}|${msg.body}`;
        if (!groupedMessages.has(key)) {
          groupedMessages.set(key, {
            ...msg,
            recipientCount: 0,
            allMessages: []
          });
        }
        
        const grouped = groupedMessages.get(key);
        grouped.recipientCount += 1;
        grouped.allMessages.push(msg);
        
        // Use the earliest created date
        if (new Date(msg.createdAt) < new Date(grouped.createdAt)) {
          grouped.createdAt = msg.createdAt;
        }
      });
      
      return Array.from(groupedMessages.values());
    },
  });

  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-lg font-medium text-red-600 mb-2">Error loading messages</div>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sent messages</h3>
        <p className="text-gray-500">Messages you send will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {messages.map((message: any) => (
          <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{message.title}</h3>
                <p className="text-gray-600 line-clamp-3">{message.body}</p>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <button
                  onClick={() => handleMessageClick(message)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Sent</span>
                </div>
              </div>
            </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>All attendees</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Sent {format(new Date(message.sentAt || message.createdAt), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">•</span>
              <span>{message.recipientCount || 0} recipients</span>
            </div>
          </div>
        </div>
      ))}
      </div>

      {/* Message View Modal */}
      {isModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Message Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Message Title */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Subject</h3>
                  <p className="text-lg font-semibold text-gray-900">{selectedMessage.title}</p>
                </div>

                {/* Message Body */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Message</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.body}</p>
                  </div>
                </div>

                {/* Message Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="font-medium">Sent</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Sent Date</h3>
                    <p className="text-gray-900">
                      {format(new Date(selectedMessage.sentAt || selectedMessage.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Audience</h3>
                    <div className="flex items-center text-gray-900">
                      <Users className="h-4 w-4 mr-2" />
                      <span>All attendees</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Recipients</h3>
                    <p className="text-gray-900">{selectedMessage.recipientCount || 0} recipients</p>
                  </div>
                </div>

                {/* Attachments */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{attachment.size}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
