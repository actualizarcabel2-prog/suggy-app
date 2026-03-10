import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Suggy</Text>
      <Text style={styles.sub}>v1.0.0 — test OK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' },
  text:      { color: '#25D366', fontSize: 48, fontWeight: 'bold' },
  sub:       { color: '#8B949E', fontSize: 14, marginTop: 8 },
});
