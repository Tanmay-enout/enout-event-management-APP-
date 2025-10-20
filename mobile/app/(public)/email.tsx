import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    console.log('=== EMAIL SUBMISSION START ===');
    console.log('Email being submitted:', email);
    console.log('Email type:', typeof email);
    console.log('Email length:', email?.length);
    
    // Validate email before sending
    if (!email || email.trim() === '') {
      setError('Please enter a valid email address');
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log('Calling requestEmailOtp with:', { email });
      const response = await api.requestEmailOtp({ email });
      console.log('=== API RESPONSE RECEIVED ===');
      console.log('Raw API response:', response);
      console.log('response.ok:', response.ok);
      console.log('response.status:', (response as any)?.status);
      console.log('response.message:', response.message);
      console.log('response.inviteStatus:', response.inviteStatus);
      
      // Safe boolean check to prevent casting errors
      const isResponseOk = Boolean(response?.ok);
      console.log('isResponseOk (safe boolean):', isResponseOk);
      
      if (isResponseOk) {
        console.log('=== USER EXISTS - NAVIGATING TO OTP ===');
        // User exists in database, navigate to OTP screen
        try {
          router.push({
            pathname: '/(public)/otp',
            params: { email },
          });
          console.log('Navigation to OTP screen successful');
        } catch (navError) {
          console.error('Navigation error:', navError);
          Alert.alert('Navigation Error', 'Could not navigate to OTP screen. Please try again.');
        }
      } else {
        console.log('=== API ERROR RESPONSE - SHOWING ALERT ===');
        console.log('About to show alert with message:', response.message);
        
        // Ensure we're not in loading state when showing alert
        setIsLoading(false);
        
        // Use setTimeout to ensure the alert shows after state update
        setTimeout(() => {
          Alert.alert(
            'Error',
            response.message || 'User with this email does not exist. Please contact the administrator to create an account.',
            [{ text: 'OK', style: 'default' }],
            { cancelable: true }
          );
        }, 100);
      }
    } catch (error) {
      console.log('=== API ERROR - SHOWING ERROR ===');
      console.error('Error in handleSubmit:', error);
      
      // Ensure we're not in loading state when showing alert
      setIsLoading(false);
      
      // Use setTimeout to ensure the alert shows after state update
      setTimeout(() => {
        Alert.alert(
          'Error',
          'User with this email does not exist. Please contact the administrator to create an account.',
          [{ text: 'OK', style: 'default' }],
          { cancelable: true }
        );
      }, 100);
    } finally {
      setIsLoading(false);
    }
    
    console.log('=== EMAIL SUBMISSION END ===');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your email to continue</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(''); // Clear error when user starts typing
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isLoading}
            />
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Please enter your registered email address to continue.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#F9B24E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
});
