import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../src/lib/api';
import { PhoneOtpForm } from '../../../src/components/FormFields/PhoneOtpForm';
import { DEV_CONFIG } from '../../../src/lib/config';
import { storage } from '../../../src/lib/storage';

// Phone OTP validation schema
const phoneOtpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type PhoneOtpFormData = z.infer<typeof phoneOtpSchema>;

export default function PhoneVerificationScreen() {
  const router = useRouter();
  const { phoneNumber: paramPhoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [phoneNumber, setPhoneNumber] = useState(paramPhoneNumber || '+1234567890');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PhoneOtpFormData>({
    resolver: zodResolver(phoneOtpSchema),
    defaultValues: {
      code: DEV_CONFIG.DEV_OTP, // Pre-fill with development OTP
    },
  });

  useEffect(() => {
    // Set the phone number from params if available
    if (paramPhoneNumber) {
      setPhoneNumber(paramPhoneNumber);
      console.log('Phone number set from params:', paramPhoneNumber);
    }
  }, [paramPhoneNumber]);

  const requestPhoneOtp = async () => {
    try {
      setIsRequestingOtp(true);
      await api.requestPhoneOtp({ phone: phoneNumber });
      Alert.alert('Success', 'Phone OTP sent successfully!');
    } catch (error) {
      console.error('Error requesting phone OTP:', error);
      Alert.alert('Error', 'Failed to send phone OTP. Please try again.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const onSubmit = async (data: PhoneOtpFormData) => {
    try {
      const response = await api.verifyPhone({ 
        code: data.code,
        phone: phoneNumber 
      });
      
      if (response.ok) {
        // Set flag that user has verified phone through mobile app
        await storage.setItem('user_verified_phone', 'true');
        console.log('Phone verification successful - setting user_verified_phone flag');
        
        Alert.alert('Success', 'Phone verification successful!');
        // Small delay to ensure API updates are reflected
        setTimeout(() => {
          router.replace('/(public)/tasks');
        }, 100);
      } else {
        Alert.alert('Error', response.message || 'Invalid phone code. Please try again.');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Invalid phone code. Please try again.');
      }
    }
  };

  const handleResendOtp = () => {
    requestPhoneOtp();
  };

  return (
    <View style={styles.container}>
      <PhoneOtpForm
        control={control}
        errors={errors}
        phoneNumber={phoneNumber}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.verifyButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Phone</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOtp}
          disabled={isRequestingOtp}
        >
          <Text style={styles.resendButtonText}>
            {isRequestingOtp ? 'Sending...' : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  actions: {
    padding: 20,
  },
  verifyButton: {
    backgroundColor: '#F9B24E',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
