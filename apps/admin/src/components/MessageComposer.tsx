'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Clock, Users, Paperclip, Calendar, Edit } from 'lucide-react';
import { api } from '@/lib/api';
// import { MessageType } from '@enout/shared';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const messageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Message body is required'),
  audience: z.enum(['all', 'invited', 'accepted']),
  scheduledFor: z.string().optional(),
});

type MessageForm = z.infer<typeof messageSchema>;

interface MessageComposerProps {
  eventId: string;
  editingDraft?: any;
  onDraftSaved?: () => void;
}

export function MessageComposer({ eventId, editingDraft, onDraftSaved }: MessageComposerProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Removed message fetching - messages are displayed in SentMessages and DraftMessages components

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      audience: 'all',
      title: editingDraft?.title || '',
      body: editingDraft?.body || '',
      scheduledFor: editingDraft?.scheduledFor || '',
    },
  });

  // Update form when editingDraft changes
  React.useEffect(() => {
    if (editingDraft) {
      setValue('title', editingDraft.title || '');
      setValue('body', editingDraft.body || '');
      setValue('audience', editingDraft.audience || 'all');
      setValue('scheduledFor', editingDraft.scheduledFor || '');
    } else {
      reset({
        title: '',
        body: '',
        audience: 'all',
        scheduledFor: '',
      });
    }
  }, [editingDraft, setValue, reset]);

  const createMessageMutation = useMutation({
    mutationFn: (data: MessageForm) => {
      if (editingDraft) {
        return api.updateMessage(eventId, editingDraft.id, { ...data, status: 'sent' });
      }
      return api.createMessage(eventId, { ...data, status: 'sent' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', eventId] });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
      reset();
      setIsSubmitting(false);
      clearAttachments();
      onDraftSaved?.();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: (data: MessageForm) => {
      if (editingDraft) {
        return api.updateMessage(eventId, editingDraft.id, { ...data, status: 'draft' });
      }
      return api.createMessage(eventId, { ...data, status: 'draft' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', eventId] });
      onDraftSaved?.();
      clearAttachments();
      toast({
        title: 'Draft saved',
        description: 'Your message has been saved as a draft.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: MessageForm) => {
    try {
      setIsSubmitting(true);
      // First create message with empty attachments
      let messageResponse;
      if (editingDraft) {
        messageResponse = await api.updateMessage(eventId, editingDraft.id, {
          ...data,
          status: 'sent',
          attachments: []
        });
      } else {
        messageResponse = await api.createMessage(eventId, {
          ...data,
          status: 'sent',
          attachments: []
        });
      }
      
      // Then upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            await api.uploadMessageAttachment(eventId, messageResponse.id, file);
          } catch (error) {
            console.error('Failed to upload attachment:', file.name, error);
            // Continue uploading other files
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['messages', eventId] });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
      reset();
      clearAttachments();
      onDraftSaved?.();
    } catch (error) {
      console.error('Failed to create message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveDraft = async (data: MessageForm) => {
    try {
      setIsSubmitting(true);
      // First create/update message with empty attachments
      let messageResponse;
      if (editingDraft) {
        messageResponse = await api.updateMessage(eventId, editingDraft.id, {
          ...data,
          status: 'draft',
          attachments: []
        });
      } else {
        messageResponse = await api.createMessage(eventId, {
          ...data,
          status: 'draft',
          attachments: []
        });
      }
      
      // Then upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            await api.uploadMessageAttachment(eventId, messageResponse.id, file);
          } catch (error) {
            console.error('Failed to upload attachment:', file.name, error);
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['messages', eventId] });
      onDraftSaved?.();
      clearAttachments();
      toast({
        title: 'Draft saved',
        description: 'Your message has been saved as a draft.',
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  const _audience = watch('audience');

  return (
    <div>
      {/* Composer */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="message-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="message-title"
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter message title"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="message-body" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message-body"
              {...register('body')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Write your message here..."
            />
            {errors.body && (
              <p className="text-sm text-red-600 mt-1">{errors.body.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
                Audience
              </label>
              <select
                id="audience"
                {...register('audience')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Attendees</option>
                <option value="invited">Invited Only</option>
                <option value="accepted">Accepted Only</option>
              </select>
            </div>

            <div>
              <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <div className="relative">
                <input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                />
                <button
                  type="button"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Add Files
                </button>
              </div>
            </div>
          </div>

          {isScheduling && (
            <div>
              <label htmlFor="schedule-for" className="block text-sm font-medium text-gray-700 mb-1">
                Schedule For
              </label>
              <input
                id="schedule-for"
                {...register('scheduledFor')}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Now'}
            </button>
            
            <button
              type="button"
              onClick={handleSubmit(onSaveDraft)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Edit className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            
            <button
              type="button"
              onClick={() => setIsScheduling(!isScheduling)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Clock className="h-4 w-4" />
              {isScheduling ? 'Cancel Schedule' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Attachments ({attachments.length})</h3>
            <button
              type="button"
              onClick={clearAttachments}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-3">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message History removed to prevent duplication with SentMessages tab */}
    </div>
  );
}
