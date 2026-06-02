import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { configurePushNotifications } from '../services/pushNotification';
import io from 'socket.io-client';
import { api } from '../services/api';

const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:4000';

export function RootNavigator() {
  const { token, user, isLoading, checkAuth } = useAuthStore();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (token) {
      configurePushNotifications();
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.id) {
      // Conectar ao Socket para ouvir notificações push simuladas
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('simulatedPush', (msg: any) => {
        console.log('SIMULATED PUSH RECEIVED:', msg);
        // Exibir apenas se for destinado a este usuário específico
        if (msg.data && msg.data.receiverId === user.id) {
          setToast({
            title: msg.title,
            body: msg.body
          });
        }
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        {token ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>

      {toast && (
        <TouchableOpacity 
          style={styles.toastContainer} 
          onPress={() => setToast(null)}
          activeOpacity={0.9}
        >
          <View style={styles.toastHeader}>
            <Text style={styles.toastHeaderText}>🔔 Notificação Push (Simulação)</Text>
          </View>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          <Text style={styles.toastBody}>{toast.body}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: '5%',
    right: '5%',
    backgroundColor: '#1A1A1A',
    borderColor: '#FF3366',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  toastHeader: {
    marginBottom: 6,
  },
  toastHeaderText: {
    color: '#FF3366',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  toastBody: {
    color: '#CCCCCC',
    fontSize: 14,
  },
});
