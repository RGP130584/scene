import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// 10.0.2.2 é o alias do Android Emulator para o localhost do host.
// No iOS (simulador), localhost funciona normalmente.
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const sendInvite = async (receiverId: string) => {
  const response = await api.post('/invites/send', { receiverId });
  return response.data;
};

export const getInvites = async () => {
  const response = await api.get('/invites');
  return response.data;
};

export const respondInvite = async (inviteId: string, status: 'accepted' | 'declined') => {
  const response = await api.put(`/invites/${inviteId}`, { status });
  return response.data;
};
