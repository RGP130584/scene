import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendToken = async () => {
    if (!email) {
      Alert.alert('Erro', 'Preencha o e-mail.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      Alert.alert('Sucesso', 'Se o e-mail existir, um código foi enviado (veja o terminal do backend para o código dev).');
      setTokenSent(true);
      // Opcional: Para facilitar testes, podemos logar ou até preencher automaticamente se o devToken vier
      if (res.data._devToken) {
        console.log("DEV TOKEN:", res.data._devToken);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword) {
      Alert.alert('Erro', 'Preencha o token e a nova senha.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      Alert.alert('Sucesso', 'Senha redefinida com sucesso!');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>

      {!tokenSent ? (
        <>
          <Text style={styles.instructions}>Digite seu e-mail para receber um token de recuperação.</Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity style={styles.button} onPress={handleSendToken} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar Token</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.instructions}>Insira o token recebido e sua nova senha.</Text>
          <TextInput
            style={styles.input}
            placeholder="Token (cole aqui)"
            placeholderTextColor="#666"
            value={token}
            onChangeText={setToken}
          />
          <TextInput
            style={styles.input}
            placeholder="Nova Senha"
            placeholderTextColor="#666"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Redefinir Senha</Text>}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
        <Text style={styles.link}>Voltar ao Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0A0A0A' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  instructions: { color: '#ccc', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  input: { backgroundColor: '#1A1A1A', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#FF3366', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  link: { color: '#aaa', fontSize: 14 },
});
