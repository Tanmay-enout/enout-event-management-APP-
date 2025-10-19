import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

export default function InviteScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    loadInvite();
  }, []);

  const loadInvite = async () => {
    try {
      const response = await api.getInvite();
      setInvite(response);
    } catch (error) {
      console.error('Error loading invite:', error);
      Alert.alert('Error', 'Failed to load invite details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    try {
      setLoading(true);
      console.log('Accepting invite...');
      await api.acceptInvite();
      console.log('Invite accepted, navigating to tasks...');
      // Navigate directly without Alert for better web compatibility
      router.replace('/(public)/tasks');
    } catch (error) {
      console.error('Error accepting invite:', error);
      Alert.alert('Error', 'Failed to accept invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F9B24E" />
        <Text style={styles.loadingText}>Loading invite...</Text>
      </View>
    );
  }

  if (!invite) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load invite</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInvite}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background gradient overlay */}
      <View style={styles.backgroundOverlay} />
      
      {/* Header with greeting and avatar */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hi, Tanmay 👋</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>TM</Text>
        </View>
      </View>

      {/* Main content area */}
      <View style={styles.contentContainer}>
        {/* Fun invitation title with emojis */}
        <View style={styles.titleContainer}>
          <Text style={styles.invitationTitle}>🎉 You have been Invited! 🎉</Text>
          <Text style={styles.subtitle}>Get ready for an amazing adventure!</Text>
        </View>

        {/* Offsite location photo with fun frame */}
        <View style={styles.imageContainer}>
          <View style={styles.imageFrame}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop'
              }}
              style={styles.offsiteImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageText}>🏖️ Paradise Awaits! 🏖️</Text>
            </View>
          </View>
        </View>

        {/* Event details with fun styling */}
        <View style={styles.eventDetails}>
          <View style={styles.eventTitleContainer}>
            <Text style={styles.eventTitle}>Brevo Phuket Offsite</Text>
            <Text style={styles.eventSubtitle}>Team Building & Adventure</Text>
          </View>
          
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>From: </Text>
                <Text style={styles.detailValue}>20 July 2025</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>To: </Text>
                <Text style={styles.detailValue}>22 July 2025</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location: </Text>
                <Text style={styles.detailValue}>Thailand 🇹🇭</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Accept invitation button - Always visible */}
      <View style={styles.buttonContainer}>
        {invite.inviteStatus === 'pending' && (
          <TouchableOpacity
            style={[styles.acceptButton, loading && styles.buttonDisabled]}
            onPress={handleAcceptInvite}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.acceptButtonText}>Accept Invitation</Text>
                <Text style={styles.buttonSubtext}>Let's go on this adventure!</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {invite.inviteStatus === 'accepted' && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace('/(public)/tasks')}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.continueButtonText}>🚀 Continue to Registration 🚀</Text>
              <Text style={styles.buttonSubtext}>Complete your setup!</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    opacity: 0.1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F9B24E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F9B24E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F9B24E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  invitationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageFrame: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  offsiteImage: {
    width: 320,
    height: 240,
    borderRadius: 20,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  imageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDetails: {
    alignItems: 'center',
    marginBottom: 30,
  },
  eventTitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 28,
  },
  eventSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    minWidth: 60,
  },
  detailValue: {
    fontSize: 15,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    paddingTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  acceptButton: {
    backgroundColor: '#febd59',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    shadowColor: '#febd59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
});
