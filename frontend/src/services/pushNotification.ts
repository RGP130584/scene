import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { api } from './api';

export function configurePushNotifications() {
  PushNotification.configure({
    // (optional) Called when Token is generated (iOS and Android)
    onRegister: async function (token) {
      console.log('FCM TOKEN GENERATED:', token);
      try {
        // Envia o token para o backend associar a este usuário
        await api.post('/users/push-token', { token: token.token });
      } catch (err) {
        console.error('Erro ao enviar push token para o backend', err);
      }
    },

    // (required) Called when a remote is received or opened, or local notification is opened
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);
    },

    // IOS ONLY (optional)
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios' || Platform.OS === 'android',
  });
}
