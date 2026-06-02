import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  TextInput, 
  Alert, 
  ScrollView,
  RefreshControl 
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { useAuthStore } from '../store/useAuthStore';
import { getInvites, sendInvite, respondInvite } from '../services/api';

export function InviteScreen() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'qrcode' | 'list'>('qrcode');
  const [receivedInvites, setReceivedInvites] = useState<any[]>([]);
  const [sentInvites, setSentInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [simulatedUserId, setSimulatedUserId] = useState('');

  const fetchAllInvites = async () => {
    try {
      const data = await getInvites();
      setReceivedInvites(data.received || []);
      setSentInvites(data.sent || []);
    } catch (err) {
      console.error('Erro ao buscar convites:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAllInvites();
    }
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllInvites();
  };

  const handleSendInvite = async (receiverId: string) => {
    if (!receiverId.trim()) {
      Alert.alert('Erro', 'Por favor, insira um ID de usuário válido.');
      return;
    }
    try {
      setLoading(true);
      await sendInvite(receiverId);
      Alert.alert('Sucesso', 'Convite enviado com sucesso!');
      setSimulatedUserId('');
      setIsScanning(false);
      fetchAllInvites();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Não foi possível enviar o convite.';
      Alert.alert('Erro', msg);
      setLoading(false);
    }
  };

  const handleRespondInvite = async (inviteId: string, status: 'accepted' | 'declined') => {
    try {
      setLoading(true);
      await respondInvite(inviteId, status);
      Alert.alert('Sucesso', `Convite ${status === 'accepted' ? 'aceito' : 'recusado'} com sucesso!`);
      fetchAllInvites();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Não foi possível responder ao convite.';
      Alert.alert('Erro', msg);
      setLoading(false);
    }
  };

  const onQRScanSuccess = (e: any) => {
    if (e.data) {
      // O QR Code contém o ID do usuário destino
      handleSendInvite(e.data);
    } else {
      Alert.alert('Erro', 'QR Code inválido.');
      setIsScanning(false);
    }
  };

  if (isScanning) {
    return (
      <View style={styles.scannerContainer}>
        <QRCodeScanner
          onRead={onQRScanSuccess}
          flashMode={RNCamera.Constants.FlashMode.off}
          showMarker={true}
          topContent={
            <Text style={styles.scannerTitle}>Escaneie o QR Code do seu amigo</Text>
          }
          bottomContent={
            <TouchableOpacity 
              style={styles.cancelScanButton} 
              onPress={() => setIsScanning(false)}
            >
              <Text style={styles.cancelScanButtonText}>Cancelar</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  const qrCodeUrl = user?.id 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${user.id}` 
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔗 Sistema de Convites</Text>
        <Text style={styles.headerSubtitle}>Convide pessoas para sua party via QR Code</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'qrcode' && styles.activeTabButton]}
          onPress={() => setActiveTab('qrcode')}
        >
          <Text style={[styles.tabText, activeTab === 'qrcode' && styles.activeTabText]}>Meu QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'list' && styles.activeTabButton]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>Convites ({receivedInvites.filter(i => i.status === 'pending').length})</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF3366" />
        </View>
      ) : activeTab === 'qrcode' ? (
        <ScrollView 
          contentContainerStyle={styles.qrTabContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF3366" />}
        >
          <View style={styles.qrCard}>
            <Text style={styles.qrCardTitle}>Apresente este QR Code</Text>
            <Text style={styles.qrCardSubtitle}>Peça para seu amigo escanear e enviar o convite</Text>
            
            {qrCodeUrl ? (
              <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
            ) : null}

            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userIdLabel}>Seu ID: <Text style={styles.userIdValue}>{user?.id}</Text></Text>
          </View>

          <TouchableOpacity style={styles.scanButton} onPress={() => setIsScanning(true)}>
            <Text style={styles.scanButtonText}>📸 Escanear QR Code de Amigo</Text>
          </TouchableOpacity>

          {/* Simulador de Scanner para testar localmente */}
          <View style={styles.simulatorCard}>
            <Text style={styles.simulatorTitle}>🧪 Simulador de Escaneamento (Sem Câmera)</Text>
            <Text style={styles.simulatorDesc}>Insira o ID do usuário que quer convidar para simular a leitura do QR Code:</Text>
            <TextInput
              style={styles.simulatorInput}
              placeholder="Digite o ID do usuário"
              placeholderTextColor="#666"
              value={simulatedUserId}
              onChangeText={setSimulatedUserId}
            />
            <TouchableOpacity 
              style={styles.simulatorButton}
              onPress={() => handleSendInvite(simulatedUserId)}
            >
              <Text style={styles.simulatorButtonText}>Simular Envio de Convite</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={[...receivedInvites, ...sentInvites]}
          keyExtractor={(item, index) => item._id || index.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF3366" />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum convite recebido ou enviado ainda.</Text>
          }
          renderItem={({ item }) => {
            const isReceived = item.receiver === user?.id || (item.receiver && item.receiver._id === user?.id);
            const statusLabel = 
              item.status === 'pending' ? 'Pendente' : 
              item.status === 'accepted' ? 'Aceito' : 'Recusado';
            
            const badgeStyle = 
              item.status === 'pending' ? styles.badgePending : 
              item.status === 'accepted' ? styles.badgeAccepted : styles.badgeDeclined;

            if (isReceived) {
              return (
                <View style={styles.inviteCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.inviteTypeLabel}>📥 Convite Recebido</Text>
                    <View style={[styles.badge, badgeStyle]}>
                      <Text style={styles.badgeText}>{statusLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.partyText}>
                    <Text style={styles.boldText}>{item.sender?.name || 'Usuário'}</Text> quer formar uma party com você!
                  </Text>
                  <Text style={styles.emailText}>{item.sender?.email}</Text>
                  
                  {item.status === 'pending' && (
                    <View style={styles.actionContainer}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.acceptBtn]}
                        onPress={() => handleRespondInvite(item._id, 'accepted')}
                      >
                        <Text style={styles.actionBtnText}>Aceitar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.declineBtn]}
                        onPress={() => handleRespondInvite(item._id, 'declined')}
                      >
                        <Text style={styles.actionBtnText}>Recusar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            } else {
              return (
                <View style={styles.inviteCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.inviteTypeLabel}>📤 Convite Enviado</Text>
                    <View style={[styles.badge, badgeStyle]}>
                      <Text style={styles.badgeText}>{statusLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.partyText}>
                    Você convidou <Text style={styles.boldText}>{item.receiver?.name || 'Usuário'}</Text> para uma party.
                  </Text>
                  <Text style={styles.emailText}>{item.receiver?.email}</Text>
                </View>
              );
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  header: { padding: 20, backgroundColor: '#1A1A1A', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#aaa', fontSize: 13, marginTop: 4, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#111', padding: 5, borderRadius: 8, margin: 15 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  activeTabButton: { backgroundColor: '#FF3366' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 14 },
  activeTabText: { color: '#fff' },
  qrTabContainer: { padding: 20, alignItems: 'center' },
  qrCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 25, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  qrCardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  qrCardSubtitle: { color: '#aaa', fontSize: 12, marginBottom: 20, textAlign: 'center' },
  qrImage: { width: 220, height: 220, borderRadius: 10, backgroundColor: '#fff', padding: 10 },
  userName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  userIdLabel: { color: '#aaa', fontSize: 12, marginTop: 5 },
  userIdValue: { color: '#FF3366', fontWeight: 'bold' },
  scanButton: { backgroundColor: '#FF3366', flexDirection: 'row', padding: 16, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  simulatorCard: { backgroundColor: '#151515', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#FF3366', borderRadius: 12, padding: 15, width: '100%', marginTop: 10 },
  simulatorTitle: { color: '#FF3366', fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  simulatorDesc: { color: '#aaa', fontSize: 12, marginBottom: 12 },
  simulatorInput: { backgroundColor: '#000', color: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 12, fontSize: 13 },
  simulatorButton: { backgroundColor: '#333', padding: 12, borderRadius: 8, alignItems: 'center' },
  simulatorButtonText: { color: '#FF3366', fontWeight: 'bold', fontSize: 13 },
  listContent: { padding: 15 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },
  inviteCard: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inviteTypeLabel: { color: '#aaa', fontSize: 12, fontWeight: 'bold' },
  partyText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  boldText: { fontWeight: 'bold', color: '#FF3366' },
  emailText: { color: '#666', fontSize: 12, marginTop: 5 },
  actionContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#2e7d32', marginRight: 10 },
  declineBtn: { backgroundColor: '#c62828' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePending: { backgroundColor: '#d84315' },
  badgeAccepted: { backgroundColor: '#2e7d32' },
  badgeDeclined: { backgroundColor: '#c62828' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  scannerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  scannerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', margin: 20 },
  cancelScanButton: { backgroundColor: '#FF3366', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, alignSelf: 'center', marginBottom: 30 },
  cancelScanButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});
