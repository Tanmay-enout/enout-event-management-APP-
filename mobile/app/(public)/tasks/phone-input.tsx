import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../src/lib/api';
import { DEV_CONFIG } from '../../../src/lib/config';
import { storage } from '../../../src/lib/storage';

// Phone number validation schema with country code
const phoneSchema = z.object({
  countryCode: z.string().min(1, 'Country code is required'),
  phoneNumber: z.string().min(7, 'Please enter a valid phone number'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export default function PhoneInputScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      countryCode: '+1',
      phoneNumber: '',
    },
  });

  const onSubmit = async (data: PhoneFormData) => {
    try {
      setIsSubmitting(true);
      
      // Clear any previous phone verification flag since user is starting new verification (user-specific)
      const userEmail = await storage.getItem('auth_email');
      const userSpecificKey = userEmail ? `user_verified_phone_${userEmail}` : 'user_verified_phone';
      await storage.removeItem(userSpecificKey);
      // Also clear the old global flag if it exists
      await storage.removeItem('user_verified_phone');
      console.log('Cleared previous phone verification flag for new verification:', userSpecificKey);
      
      // Combine country code and phone number
      const fullPhoneNumber = `${data.countryCode}${data.phoneNumber}`;
      console.log('Submitting phone number:', fullPhoneNumber);
      
      // First, update the profile with the phone number
      console.log('Updating profile with phone number...');
      const updateResponse = await api.updateMe({ phone: fullPhoneNumber });
      
      if (!updateResponse.ok) {
        throw new Error(updateResponse.message || 'Failed to update phone number');
      }
      
      console.log('Phone number updated successfully');
      
      // Then request OTP for the phone number
      console.log('Requesting phone OTP...');
      const otpResponse = await api.requestPhoneOtp({ phone: fullPhoneNumber });
      
      if (!otpResponse.ok) {
        throw new Error(otpResponse.message || 'Failed to send OTP');
      }
      
      console.log('OTP requested successfully');
      
      // Navigate to OTP verification screen
      router.push({
        pathname: '/(public)/tasks/phone',
        params: { phoneNumber: fullPhoneNumber }
      });
      
    } catch (error) {
      console.error('Error in phone input submission:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Phone Number</Text>
        <Text style={styles.subtitle}>
          We'll send you a 6-digit verification code to confirm your phone number.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.phoneInputContainer}>
              <Controller
                control={control}
                name="countryCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.countryCodeInput, errors.countryCode && styles.inputError]}
                    placeholder="+1"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                  />
                )}
              />
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.phoneNumberInput, errors.phoneNumber && styles.inputError]}
                    placeholder="1234567890"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                  />
                )}
              />
            </View>
            {(errors.phoneNumber || errors.countryCode) && (
              <Text style={styles.errorText}>
                {errors.countryCode?.message || errors.phoneNumber?.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Make sure your phone number is correct. You'll receive the code via SMS.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: 100,
  },
  phoneNumberInput: {
    flex: 2,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hint: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
});
