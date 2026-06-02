import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function PlaceholderScreen({ route }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tela em construção</Text>
      <Text style={styles.subtitle}>{route.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#FF3366' },
});
