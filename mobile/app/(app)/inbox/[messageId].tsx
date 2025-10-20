import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../src/lib/api';
import { AttachmentList } from '../../../src/components/AttachmentList';
import { formatDateTime } from '../../../src/lib/time';

interface MessageDetail {
  subject: string;
  text: string;
  attachments: Array<{
    name: string;
    url: string;
  }>;
}

export default function MessageDetailScreen() {
  const router = useRouter();
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (messageId) {
      loadMessage();
    }
  }, [messageId]);

  const loadMessage = async () => {
    try {
      const response = await api.getMessage(messageId!);
      
      // Handle both old mock response and new API response format
      if (response.ok && response.data) {
        // New API format - map to expected format
        const apiData = response.data;
        setMessage({
          subject: apiData.title || apiData.subject || 'No Subject',
          text: apiData.body || apiData.text || '',
          attachments: apiData.attachments || [],
        });
      } else if ((response as any).subject) {
        // Old mock format
        setMessage({
          subject: (response as any).subject || 'No Subject',
          text: (response as any).text || '',
          attachments: (response as any).attachments || [],
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error loading message:', error);
      Alert.alert('Error', 'Failed to load message');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAcknowledge = async () => {
    try {
      setAcknowledging(true);
      await api.acknowledgeMessage(messageId!);
      // Navigate back to inbox
      router.replace('/(app)/inbox');
    } catch (error) {
      console.error('Error acknowledging message:', error);
      Alert.alert('Error', 'Failed to acknowledge message');
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F9B24E" />
        <Text style={styles.loadingText}>Loading message...</Text>
      </View>
    );
  }

  if (!message) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Message not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subject}>{message.subject}</Text>
          <Text style={styles.timestamp}>
            {formatDateTime(new Date().toISOString())}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.text}>{message.text}</Text>
        </View>

        {message.attachments && message.attachments.length > 0 && (
          <AttachmentList attachments={message.attachments} />
        )}

        {/* Acknowledge Button */}
        <TouchableOpacity
          style={[styles.acknowledgeButton, acknowledging && styles.buttonDisabled]}
          onPress={handleAcknowledge}
          disabled={acknowledging}
        >
          {acknowledging ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.acknowledgeButtonText}>✓ Acknowledge</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    backgroundColor: '#febd59',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#febd59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  backButtonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#febd59',
  },
  subject: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 12,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  timestamp: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  body: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  text: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  acknowledgeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginHorizontal: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
