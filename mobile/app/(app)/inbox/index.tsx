import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../../src/lib/api';

interface Message {
  id: string;
  title: string; // API returns 'title' not 'subject'
  body: string; // API returns 'body' not 'snippet'
  createdAt: string; // API returns 'createdAt' not 'sentAt'
  unread: boolean;
  attachments?: Record<string, any>; // API returns 'attachments' object
  // Computed fields for display
  subject?: string;
  snippet?: string;
  sentAt?: string;
  attachmentsCount?: number;
  sender?: string;
  avatar?: string;
}

export default function InboxScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      console.log('Loading messages...');
      const response = await api.listMessages();
      
      console.log('Messages API response:', response);
      
      if (response.ok && response.data) {
        // New API format - map the response data properly
        const apiData = response.data as any;
        const rawMessages = apiData.data || apiData || [];
        
        // Map API message format to UI format
        const mappedMessages: Message[] = rawMessages.map((msg: any) => ({
          id: msg.id || '',
          title: msg.title || '',
          body: msg.body || '',
          createdAt: msg.createdAt || '',
          unread: msg.unread || false,
          attachments: msg.attachments || {},
          // Map to display fields
          subject: msg.title || '',
          snippet: msg.body || '',
          sentAt: msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '',
          attachmentsCount: msg.attachments ? Object.keys(msg.attachments).length : 0,
          sender: 'Event Organizer', // Default sender for now
          avatar: 'E',
        }));
        
        console.log('Mapped messages:', mappedMessages);
        setMessages(mappedMessages);
      } else {
        console.error('Messages API response not OK:', response.message);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMessagePress = (messageId: string) => {
    router.push(`/(app)/inbox/${messageId}`);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => handleMessagePress(item.id)}
    >
      <View style={styles.messageContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.sender ? item.sender.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>
        
        <View style={styles.messageDetails}>
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>{item.sender || 'Unknown'}</Text>
            <Text style={styles.timestamp}>{item.sentAt || 'Unknown time'}</Text>
          </View>
          <Text style={styles.messageSnippet} numberOfLines={2}>
            {item.snippet || 'No message content'}
          </Text>
        </View>
        
        {item.unread && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F9B24E" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#F9B24E"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>✉️</Text>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Mail</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(app)/schedule')}
        >
          <Text style={styles.navIcon}>🕐</Text>
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(app)/profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1a202c',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  messageItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#febd59',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#febd59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  messageDetails: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a202c',
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  messageSnippet: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#febd59',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  navLabel: {
    fontSize: 13,
    color: '#2d3748',
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  activeNavLabel: {
    color: '#1a202c',
    fontWeight: '700',
    fontSize: 14,
  },
});
