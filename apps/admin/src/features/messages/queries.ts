import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { messagesApi, MessageQueryParams, ScheduleRequest } from './api';
import { MessageType } from '@enout/shared';

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (eventId: string, params: MessageQueryParams) => [...messageKeys.lists(), eventId, params] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (eventId: string, messageId: string) => [...messageKeys.details(), eventId, messageId] as const,
};

// Get messages query
export function useMessagesQuery(eventId: string, params: MessageQueryParams = {}) {
  return useQuery({
    queryKey: messageKeys.list(eventId, params),
    queryFn: () => messagesApi.getMessages(eventId, params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get single message query
export function useMessageQuery(eventId: string, messageId: string) {
  return useQuery({
    queryKey: messageKeys.detail(eventId, messageId),
    queryFn: () => messagesApi.getMessage(eventId, messageId),
    enabled: !!messageId,
  });
}

// Create message mutation
export function useCreateMessageMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: Partial<MessageType>) => messagesApi.createMessage(eventId, message),
    onSuccess: (_newMessage) => {
      // Invalidate and refetch messages list
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast({
        title: 'Draft saved',
        description: 'Your message has been saved as a draft.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save message',
        variant: 'destructive',
      });
    },
  });
}

// Update message mutation
export function useUpdateMessageMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, message }: { messageId: string; message: Partial<MessageType> }) =>
      messagesApi.updateMessage(eventId, messageId, message),
    onSuccess: (updatedMessage, { messageId }) => {
      // Update the specific message in cache
      queryClient.setQueryData(messageKeys.detail(eventId, messageId), updatedMessage);
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast({
        title: 'Message updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update message',
        variant: 'destructive',
      });
    },
  });
}

// Delete message mutation
export function useDeleteMessageMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.deleteMessage(eventId, messageId),
    onSuccess: (_, messageId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: messageKeys.detail(eventId, messageId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast({
        title: 'Message deleted',
        description: 'The message has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete message',
        variant: 'destructive',
      });
    },
  });
}

// Send message mutation
export function useSendMessageMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.sendMessage(eventId, messageId),
    onSuccess: (sentMessage, messageId) => {
      // Update the message in cache
      queryClient.setQueryData(messageKeys.detail(eventId, messageId), sentMessage);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent to all attendees.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });
}

// Schedule message mutation
export function useScheduleMessageMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, schedule }: { messageId: string; schedule: ScheduleRequest }) =>
      messagesApi.scheduleMessage(eventId, messageId, schedule),
    onSuccess: (scheduledMessage, { messageId }) => {
      // Update the message in cache
      queryClient.setQueryData(messageKeys.detail(eventId, messageId), scheduledMessage);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast({
        title: 'Message scheduled',
        description: 'Your message has been scheduled for delivery.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule message',
        variant: 'destructive',
      });
    },
  });
}

// Resend message mutation
export function useResendMessageMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.resendMessage(eventId, messageId),
    onSuccess: (resentMessage, messageId) => {
      // Update the message in cache
      queryClient.setQueryData(messageKeys.detail(eventId, messageId), resentMessage);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast({
        title: 'Message resent',
        description: 'Your message has been resent to all attendees.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend message',
        variant: 'destructive',
      });
    },
  });
}

// Upload attachment mutation
export function useUploadAttachmentMutation(eventId: string) {
  return useMutation({
    mutationFn: ({ messageId, file }: { messageId: string; file: File }) =>
      messagesApi.uploadAttachment(eventId, messageId, file),
    onSuccess: () => {
      toast({
        title: 'Attachment uploaded',
        description: 'File has been attached to your message.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload attachment',
        variant: 'destructive',
      });
    },
  });
}

