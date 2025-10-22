import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../../src/lib/api';
import { storage } from '../../../src/lib/storage';

export default function TasksScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{ firstName: string; email: string } | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userVerifiedPhone, setUserVerifiedPhone] = useState<boolean>(false);
  const [tasks, setTasks] = useState([
    {
      id: 'id',
      title: 'Upload ID Card',
      description: 'Upload your ID for hotel check-in',
      icon: '🆔',
      status: 'pending',
      dueDate: '10 July 2025'
    },
    {
      id: 'form',
      title: 'Registration Form',
      description: 'Complete your registration details',
      icon: '📝',
      status: 'pending',
      dueDate: '10 July 2025'
    },
    {
      id: 'phone-input',
      title: 'Phone Verification',
      description: 'Verify your phone number',
      icon: '📱',
      status: 'pending',
      dueDate: '10 July 2025'
    }
  ]);

  // Load user info and check task completion status when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      // Ensure phone verification flag is properly initialized for the current user
      const initializePhoneVerification = async () => {
        const userEmail = await storage.getItem('auth_email');
        if (!userEmail) {
          console.log('No user email found - skipping phone verification initialization');
          setUserVerifiedPhone(false);
          return;
        }
        
        const userSpecificKey = `user_verified_phone_${userEmail}`;
        const currentFlag = await storage.getItem(userSpecificKey);
        console.log('=== PHONE VERIFICATION INITIALIZATION ===');
        console.log('User email:', userEmail);
        console.log('User-specific key:', userSpecificKey);
        console.log('Current flag from storage:', currentFlag);
        console.log('Flag type:', typeof currentFlag);
        
        // Only trust the flag if it's explicitly set to 'true' for this specific user
        if (currentFlag !== 'true') {
          console.log('Phone verification not completed for this user - clearing flag');
          await storage.removeItem(userSpecificKey);
          // Also clear the old global flag if it exists
          await storage.removeItem('user_verified_phone');
          setUserVerifiedPhone(false);
        } else {
          console.log('Phone verification flag is valid for this user');
          setUserVerifiedPhone(true);
        }
      };
      
      initializePhoneVerification();
      loadUserInfo();
      // Add small delay to ensure any previous API calls have completed
      setTimeout(() => {
        checkTaskStatus();
      }, 500);
    }, [])
  );

  const loadUserInfo = async () => {
    try {
      const userEmail = await storage.getItem('auth_email');
      if (userEmail) {
        const userResponse = await api.getUserInfo();
        if (userResponse.ok && userResponse.user) {
          setUserInfo({
            firstName: userResponse.user.firstName || userEmail.split('@')[0],
            email: userEmail,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const checkTaskStatus = async () => {
    try {
      // Get actual profile data from API to check task completion
      const profileResponse = await api.getMe();
      
      console.log('=== TASK STATUS CHECK DEBUG ===');
      console.log('Profile response:', profileResponse);
      console.log('Profile response ok:', profileResponse.ok);
      console.log('Profile response data:', profileResponse.data);
      
      if (!profileResponse.ok) {
        console.error('Failed to get profile data - response not ok:', profileResponse.message);
        return;
      }
      
      if (!profileResponse.data) {
        console.error('Failed to get profile data - no data in response');
        return;
      }
      
      const profile = profileResponse.data as any;
      setCurrentProfile(profile); // Store profile data for use in handleTaskPress
      console.log('Full profile object:', profile);
      console.log('Checking task status with profile data:', {
        idDocUrl: profile.idDocUrl,
        firstName: profile.firstName,
        lastName: profile.lastName,
        gender: profile.gender,
        phoneVerified: profile.phoneVerified,
        phone: profile.phone
      });
      
      // Check if user has verified phone through mobile app
      const userEmail = await storage.getItem('auth_email');
      const userSpecificKey = userEmail ? `user_verified_phone_${userEmail}` : 'user_verified_phone';
      const userVerifiedPhoneFlag = await storage.getItem(userSpecificKey);
      const hasUserVerifiedPhone = userVerifiedPhoneFlag === 'true';
      setUserVerifiedPhone(hasUserVerifiedPhone);
      
      console.log('Phone verification status:', {
        userEmail: userEmail,
        userSpecificKey: userSpecificKey,
        userVerifiedPhoneFlag: userVerifiedPhoneFlag,
        hasUserVerifiedPhone: hasUserVerifiedPhone,
        profilePhoneVerified: profile.phoneVerified,
        willIgnoreAdminVerification: profile.phoneVerified && !hasUserVerifiedPhone
      });
      
      // Use the current tasks state to avoid closure issues
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.map(task => {
          if (task.id === 'id') {
            // Check if ID document has been uploaded
            const idUploaded = profile.idDocUrl && profile.idDocUrl.trim() !== '';
            console.log(`ID upload task: ${idUploaded ? 'completed' : 'pending'} (url: ${profile.idDocUrl})`);
            return { ...task, status: idUploaded ? 'completed' : 'pending' };
          }
          
          if (task.id === 'form') {
            // Check if registration form is completed (has required fields filled)
            const formCompleted = profile.firstName && 
                                profile.lastName && 
                                profile.firstName.trim() !== '' && 
                                profile.lastName.trim() !== '' &&
                                profile.gender && 
                                profile.gender.trim() !== '';
            console.log(`Form task: ${formCompleted ? 'completed' : 'pending'} (firstName: ${profile.firstName}, lastName: ${profile.lastName}, gender: ${profile.gender})`);
            return { ...task, status: formCompleted ? 'completed' : 'pending' };
          }
          
          if (task.id === 'phone-input') {
            // CRITICAL: Only mark as completed if user verified phone with OTP in mobile app
            // Completely ignore any admin-entered phone verification status
            const isCompleted = hasUserVerifiedPhone;
            console.log(`Phone task status check:`, {
              taskId: task.id,
              userVerifiedPhoneFlag: userVerifiedPhoneFlag,
              hasUserVerifiedPhone: hasUserVerifiedPhone,
              isCompleted: isCompleted,
              profilePhoneVerified: profile.phoneVerified,
              message: isCompleted ? 'COMPLETED by user OTP verification' : 'PENDING - user must verify with OTP'
            });
            return { ...task, status: isCompleted ? 'completed' : 'pending' };
          }
          
          return task;
        });

        return updatedTasks;
      });
    } catch (error) {
      console.error('Error checking task status:', error);
    }
  };

  // Check if all tasks are completed (same logic for all tasks now)
  const allTasksCompleted = tasks.every(task => task.status === 'completed');

  const handleTaskPress = (taskId: string) => {
    console.log('=== TASK PRESS DEBUG ===');
    console.log('Task ID:', taskId);
    console.log('Current profile:', currentProfile);
    console.log('Tasks:', tasks);
    
    // Don't allow navigation to completed tasks (same logic for all tasks including phone)
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'completed') {
      console.log('Task is completed, not allowing navigation:', taskId);
      return; // Do nothing if task is completed
    }
    
    // Default navigation for all tasks
    console.log('Default navigation for task:', taskId);
    router.push(`/(public)/tasks/${taskId}`);
  };

  const handleContinueToApp = () => {
    // Navigate to the main app - using inbox as the home screen for now
    router.replace('/(app)/inbox');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hi, {userInfo?.firstName || 'User'} 👋
        </Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userInfo ? userInfo.firstName.substring(0, 2).toUpperCase() : 'U'}
          </Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Tasks for Registration</Text>
        <Text style={styles.subtitle}>Complete these tasks to finish your registration</Text>
      </View>


      {/* Task Details */}
      <ScrollView style={styles.content}>
        {tasks.map((task) => {
          // Disable task if it's completed (same logic for all tasks including phone)
          const isTaskDisabled = task.status === 'completed';
          
          return (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                task.status === 'completed' && styles.completedCard,
                isTaskDisabled && styles.disabledCard
              ]}
              onPress={() => handleTaskPress(task.id)}
              disabled={isTaskDisabled}
            >
              <View style={styles.taskHeader}>
                <Text style={styles.taskIcon}>{task.icon}</Text>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                </View>
                {task.status !== 'completed' && (
                  <Text style={styles.arrow}>›</Text>
                )}
                {task.status === 'completed' && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
              </View>
              
              <View style={styles.taskFooter}>
                <Text style={styles.dueDate}>Complete by: {task.dueDate}</Text>
                {task.status === 'pending' && (
                  <Text style={styles.dueSoon}>Due soon</Text>
                )}
                {task.status === 'completed' && (
                  <Text style={styles.completed}>Completed</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Continue Button - Only show when all tasks are completed */}
      {allTasksCompleted && (
        <View style={styles.continueContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueToApp}
          >
            <Text style={styles.continueButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dc3545',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  disabledCard: {
    opacity: 0.7,
    borderStyle: 'solid',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  arrow: {
    fontSize: 24,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  checkIcon: {
    fontSize: 24,
    color: '#28a745',
    fontWeight: 'bold',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  dueSoon: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '600',
  },
  completed: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  continueContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  continueButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
