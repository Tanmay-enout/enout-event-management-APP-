import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../../src/lib/api';
import { ScheduleList } from '../../../src/components/ScheduleList';

interface ScheduleItem {
  id: string;
  start: Date | string;
  end: Date | string;
  title: string;
  location?: string | null;
  notes?: string | null;
  color?: string | null;
  allDay: boolean;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      console.log('Loading schedule...');
      const response = await api.getSchedule();
      
      console.log('Schedule API response:', response);
      
      if (response.ok && response.data) {
        // New API format - map the response data properly
        const apiData = response.data as any;
        const rawSchedule = apiData.data || apiData || [];
        
        // Map API schedule format to UI format
        const mappedSchedule: ScheduleItem[] = rawSchedule.map((item: any) => ({
          id: item.id || '',
          start: item.start || new Date(),
          end: item.end || new Date(),
          title: item.title || '',
          location: item.location || null,
          notes: item.notes || null,
          color: item.color || null,
          allDay: item.allDay || false,
        }));
        
        console.log('Mapped schedule:', mappedSchedule);
        setSchedule(mappedSchedule);
      } else {
        console.error('Schedule API response not OK:', response.message);
        setSchedule([]);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F9B24E" />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Schedule</Text>
        <Text style={styles.subtitle}>
          {schedule.length} session{schedule.length !== 1 ? 's' : ''} scheduled
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#F9B24E"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScheduleList schedule={schedule} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(app)/inbox')}
        >
          <Text style={styles.navIcon}>✉️</Text>
          <Text style={styles.navLabel}>Mail</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🕐</Text>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Schedule</Text>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
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
    fontSize: 32,
    fontWeight: '800',
    color: '#1a202c',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
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
