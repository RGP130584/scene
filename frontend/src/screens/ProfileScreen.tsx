import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export function ProfileScreen() {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfileData(res.data);
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Não foi possível carregar o perfil.</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profileData.user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profileData.user.name}</Text>
        <Text style={styles.email}>{profileData.user.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{profileData.totalCheckins}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{profileData.points}</Text>
          <Text style={styles.statLabel}>Pontos</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FF3366', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  email: { color: '#aaa', fontSize: 16, marginTop: 5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1A1A1A', padding: 20, borderRadius: 15, marginBottom: 40 },
  statBox: { alignItems: 'center' },
  statNumber: { color: '#FF3366', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#aaa', fontSize: 14, marginTop: 5 },
  logoutBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#FF3366', fontWeight: 'bold', fontSize: 16 },
  errorText: { color: '#fff', marginBottom: 20 }
});
