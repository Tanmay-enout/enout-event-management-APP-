import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function DevDataBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Data: REAL API</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(249, 178, 78, 0.9)', // #F9B24E with opacity
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    zIndex: 1000,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
