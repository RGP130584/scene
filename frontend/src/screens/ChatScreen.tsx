import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import io from 'socket.io-client';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

// Pega a URL do Axios e arranca o '/api' do final para conectar no Socket
const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:4000';

export function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const user = useAuthStore((state) => state.user);
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Carregar histórico
    const fetchHistory = async () => {
      try {
        const res = await api.get('/chat/history');
        setMessages(res.data);
      } catch (err) {
        console.error('Erro ao buscar histórico', err);
      }
    };
    fetchHistory();

    // Conectar ao Socket.io
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('newMessage', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    if (!inputText.trim() || !user) return;

    socketRef.current.emit('sendMessage', {
      userId: user.id,
      text: inputText,
    });
    
    setInputText('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender._id === user?.id;
    return (
      <View style={[styles.msgContainer, isMe ? styles.myMsg : styles.otherMsg]}>
        {!isMe && <Text style={styles.senderName}>{item.sender.name}</Text>}
        <Text style={styles.msgText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bate-papo Global</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 15, backgroundColor: '#1A1A1A', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listContent: { padding: 15 },
  msgContainer: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#FF3366', borderBottomRightRadius: 0 },
  otherMsg: { alignSelf: 'flex-start', backgroundColor: '#333', borderBottomLeftRadius: 0 },
  senderName: { color: '#aaa', fontSize: 12, marginBottom: 4, fontWeight: 'bold' },
  msgText: { color: '#fff', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#1A1A1A' },
  input: { flex: 1, backgroundColor: '#0A0A0A', color: '#fff', paddingHorizontal: 15, borderRadius: 20, marginRight: 10 },
  sendButton: { backgroundColor: '#FF3366', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 20 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' }
});
