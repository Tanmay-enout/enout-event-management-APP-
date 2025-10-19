import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../src/lib/api';
import { DEV_CONFIG } from '../../src/lib/config';

// Email validation schema
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function EmailScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '', // Allow any email to be entered
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    try {
      console.log('Submitting email:', data.email);
      const response = await api.requestEmailOtp({ email: data.email });
      console.log('API response:', response);
      
      if (response.ok) {
        console.log('Email accepted, navigating to OTP');
        // Navigate directly to OTP screen (removing Alert for now)
        console.log('About to call router.replace with:', {
          pathname: '/(public)/otp',
          params: { email: data.email },
        });
        router.replace({
          pathname: '/(public)/otp',
          params: { email: data.email },
        });
        console.log('router.replace called');
      } else if (response.inviteStatus === 'not_found') {
        console.log('Email not found, navigating to retry');
        // Navigate to retry screen
        router.push({
          pathname: '/(public)/retry',
          params: { email: data.email },
        });
      } else {
        console.log('Unexpected response:', response);
        Alert.alert('Error', 'Unexpected response from server');
      }
    } catch (error) {
      console.error('Error in onSubmit:', error);
      // For dev mode, if API fails, still try to navigate with any email
      if (DEV_CONFIG.DEV_AUTH_ENABLED) {
        console.log('DEV MODE: Navigating to OTP despite error with any email');
        router.replace({
          pathname: '/(public)/otp',
          params: { email: data.email },
        });
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
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
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isSubmitting}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
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
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          DEV MODE: Use any email address - OTP is fixed as {DEV_CONFIG.DEV_OTP}
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
