import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../../src/lib/api';
import { UploadIdCard } from '../../../src/components/FormFields/UploadIdCard';

export default function UploadIdScreen() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileSelected = async (file: any) => {
    try {
      setIsUploading(true);
      const response = await api.uploadId(file);
      
      if (response.ok && response.fileUrl) {
        setUploadedFileName(file.name || file.fileName || 'Document uploaded');
        // Don't navigate automatically - wait for continue button
      } else {
        Alert.alert('Error', response.message || 'Failed to upload ID card. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading ID:', error);
      Alert.alert('Error', 'Failed to upload ID card. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = () => {
    // Small delay to ensure API updates are reflected
    setTimeout(() => {
      router.replace('/(public)/tasks');
    }, 100);
  };

  return (
    <View style={styles.container}>
      <UploadIdCard
        onFileSelected={handleFileSelected}
        isUploading={isUploading}
        uploadedFileName={uploadedFileName || undefined}
        onContinue={handleContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
