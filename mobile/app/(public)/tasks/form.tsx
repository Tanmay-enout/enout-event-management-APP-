import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../src/lib/api';
import { RegistrationForm } from '../../../src/components/FormFields/RegistrationForm';

// Registration form validation schema
const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  surname: z.string().min(1, 'Surname is required'),
  workEmail: z.string().email('Please enter a valid work email'),
  location: z.string().min(1, 'Location is required'),
  mealPreference: z.string().min(1, 'Please select a meal preference'),
  gender: z.string().min(1, 'Please select your gender'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function RegistrationFormScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      surname: '',
      workEmail: '',
      location: '',
      mealPreference: '',
      gender: '',
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      const response = await api.saveRegistrationForm(data);
      
      if (response.ok) {
        // Small delay to ensure API updates are reflected
        setTimeout(() => {
          router.replace('/(public)/tasks');
        }, 100);
      }
    } catch (error) {
      console.error('Error saving registration form:', error);
      Alert.alert('Error', 'Failed to save registration form. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Complete Your Registration</Text>
        <Text style={styles.subtitle}>
          Please fill out the form below to complete your registration for the event.
        </Text>

        <RegistrationForm control={control} errors={errors} />

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save & Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginTop: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
