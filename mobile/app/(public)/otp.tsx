import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../src/lib/api';
import { DEV_CONFIG } from '../../src/lib/config';

// OTP validation schema
const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type OtpFormData = z.infer<typeof otpSchema>;

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: DEV_CONFIG.DEV_OTP, // Pre-fill with dev OTP
    },
  });

  const onSubmit = async (data: OtpFormData) => {
    try {
      console.log('OTP Screen: Submitting OTP:', data.code);
      const response = await api.verifyEmail({ 
        email: email || '', 
        code: data.code 
      });
      
      console.log('OTP Screen: API response:', response);
      
      if (response.ok) {
        console.log('OTP Screen: Email verified, inviteStatus:', response.inviteStatus);
        
        // Navigate directly without Alert for testing
        console.log('OTP Screen: Navigating directly...');
        if (response.inviteStatus === 'pending') {
          console.log('OTP Screen: Navigating to invite screen');
          router.push('/invite');
        } else if (response.inviteStatus === 'accepted') {
          console.log('OTP Screen: Navigating to tasks screen');
          router.push('/tasks');
        } else {
          console.log('OTP Screen: Navigating to splash screen');
          router.push('/splash');
        }
      }
    } catch (error) {
      console.error('OTP Screen: Error in onSubmit:', error);
      // For dev mode, if API fails, still try to navigate with dev credentials
      if (email === DEV_CONFIG.DEV_EMAIL && data.code === DEV_CONFIG.DEV_OTP) {
        console.log('DEV MODE: Navigating despite error - using dev credentials');
        router.push('/invite'); // Navigate to invite screen as fallback
      } else {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Error', 'Invalid OTP. Please try again.');
        }
      }
    }
  };

  const handleBack = () => {
    console.log('Back button pressed, navigating to email screen');
    router.push('/(public)/email');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.code && styles.inputError]}
                  placeholder="000000"
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!isSubmitting}
                  autoFocus
                />
                {errors.code && (
                  <Text style={styles.errorText}>{errors.code.message}</Text>
                )}
              </View>
            )}
          />

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back to Email</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          DEV MODE: Use {DEV_CONFIG.DEV_OTP} for instant verification
        </Text>
      </View>
    </View>
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
    textAlign: 'center',
  },
  email: {
    fontWeight: 'bold',
    color: '#F9B24E',
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
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 4,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#F9B24E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  hint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
});
