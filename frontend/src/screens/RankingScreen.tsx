import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export function RankingScreen() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const myId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await api.get('/users/ranking');
        setRanking(res.data);
      } catch (err) {
        console.error('Erro ao buscar ranking:', err);
      } finally {
        setLoading(false);
      }
    };
    // Idealmente usar focus listener, mas array vazio serve para montagem
    fetchRanking();
  }, []);

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isMe = item._id === myId;
    let rankColor = '#666';
    if (index === 0) rankColor = '#FFD700'; // Ouro
    if (index === 1) rankColor = '#C0C0C0'; // Prata
    if (index === 2) rankColor = '#CD7F32'; // Bronze

    return (
      <View style={[styles.rankCard, isMe && styles.myRankCard]}>
        <View style={styles.rankLeft}>
          <Text style={[styles.rankPos, { color: rankColor }]}>{index + 1}º</Text>
          <Text style={[styles.rankName, isMe && styles.myName]}>{item.name} {isMe && '(Você)'}</Text>
        </View>
        <View style={styles.rankRight}>
          <Text style={styles.rankPoints}>{item.points} pts</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Os exploradores mais ativos</Text>
      </View>

      <FlatList
        data={ranking}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum check-in registrado ainda.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  header: { padding: 30, backgroundColor: '#1A1A1A', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#aaa', fontSize: 14, marginTop: 5 },
  listContainer: { padding: 15 },
  rankCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 15, borderRadius: 12, marginBottom: 10 },
  myRankCard: { borderColor: '#FF3366', borderWidth: 1 },
  rankLeft: { flexDirection: 'row', alignItems: 'center' },
  rankPos: { fontSize: 20, fontWeight: 'bold', marginRight: 15, width: 35 },
  rankName: { color: '#fff', fontSize: 16 },
  myName: { fontWeight: 'bold', color: '#FF3366' },
  rankRight: { alignItems: 'flex-end' },
  rankPoints: { color: '#FF3366', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 }
});
