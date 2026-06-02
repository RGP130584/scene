import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { api } from '../services/api';

export function CheckinScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const onSuccess = async (e: any) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      const response = await api.post('/checkin', { qrData: e.data });
      Alert.alert(
        'Check-in Realizado!',
        response.data.message || 'Presença registrada com sucesso.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Erro no Check-in',
        error.response?.data?.message || 'Não foi possível registrar o check-in.',
        [{ text: 'Tentar Novamente', onPress: () => { setScanned(false); setLoading(false); } }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3366" />
          <Text style={styles.loadingText}>Registrando sua presença...</Text>
        </View>
      ) : (
        <QRCodeScanner
          onRead={onSuccess}
          flashMode={RNCamera.Constants.FlashMode.auto}
          reactivate={false}
          showMarker={true}
          markerStyle={styles.marker}
          topContent={
            <Text style={styles.topText}>
              Aponte a câmera para o QR Code do evento ou local.
            </Text>
          }
          bottomContent={
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 18,
  },
  topText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    padding: 20,
  },
  marker: {
    borderColor: '#FF3366',
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
