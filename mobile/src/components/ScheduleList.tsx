import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime, formatDate } from '../lib/time';

interface ScheduleItem {
  id: string;
  start: string;
  end: string;
  title: string;
  location: string;
  notes?: string;
}

interface ScheduleListProps {
  schedule: ScheduleItem[];
}

export function ScheduleList({ schedule }: ScheduleListProps) {
  if (schedule.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No schedule items found</Text>
      </View>
    );
  }

  // Group schedule items by date
  const groupedSchedule = schedule.reduce((groups, item) => {
    const date = formatDate(item.start);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, ScheduleItem[]>);

  return (
    <View style={styles.container}>
      {Object.entries(groupedSchedule).map(([date, items]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>{date}</Text>
          {items.map((item) => (
            <View 
              key={item.id} 
              style={styles.scheduleItem}
            >
              <View style={styles.timeContainer}>
                <Text style={styles.time}>
                  {formatTime(item.start)} - {formatTime(item.end)}
                </Text>
              </View>
              <View style={styles.contentContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.location}>📍 {item.location}</Text>
                {item.notes && (
                  <Text style={styles.notes}>{item.notes}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dateGroup: {
    marginBottom: 32,
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#febd59',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#febd59',
  },
  timeContainer: {
    width: 90,
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 13,
    color: '#febd59',
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 18,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 6,
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  location: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  notes: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});
