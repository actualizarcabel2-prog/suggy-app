// ============================================================
// ChatScreen.js — Chat con Suggy (bot WhatsApp VPS)
// Socket.io tiempo real + guarda conversaciones en móvil (7 días rolling)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { VPS_URL, APP_CONFIG } from '../config';
import { initSuggyFolder, saveMessage, loadRecentMessages } from '../hooks/useStorage';

const { colors, storage } = APP_CONFIG;

export default function ChatScreen({ route, navigation }) {
  const nombreProp = route?.params?.nombre || '';
  const [messages,  setMessages]  = useState([]);
  const [inputText, setInputText] = useState('');
  const [token,     setToken]     = useState(null);
  const [nombre,    setNombre]    = useState(nombreProp);
  const [connected, setConnected] = useState(false);
  const [typing,    setTyping]    = useState(false);
  const [sending,   setSending]   = useState(false);
  const socketRef    = useRef(null);
  const flatListRef  = useRef(null);
  const typingTimer  = useRef(null);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem(storage.token);
      const n = await AsyncStorage.getItem(storage.username);
      if (!t) { navigation.replace('Login'); return; }
      setToken(t);
      if (n) setNombre(n);

      // Inicializar carpeta Suggy en el móvil
      await initSuggyFolder();

      // Cargar historial local primero (instantáneo)
      const local = await loadRecentMessages(7);
      if (local.length > 0) setMessages(local);

      // Luego cargar del VPS
      await loadHistoryVPS(t);
      connectSocket(t);
    })();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearTimeout(typingTimer.current);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const loadHistoryVPS = async (t) => {
    try {
      const res = await fetch(`${VPS_URL}/api/chat/history?limit=50`, {
        headers: { 'x-session-token': t },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages?.length) setMessages(data.messages);
      }
    } catch (_) {}
  };

  const connectSocket = (t) => {
    const socket = io(VPS_URL, {
      auth: { token: t },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 15,
    });
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('app_message', (data) => {
      const msg = {
        id:        Date.now().toString() + Math.random(),
        text:      data.message || data.text || '',
        fromMe:    false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, msg]);
      saveMessage(msg); // guardar en móvil
      setTyping(false);
    });

    socket.on('app_typing', (data) => {
      if (data.typing) {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 6000);
      } else {
        setTyping(false);
      }
    });
    socketRef.current = socket;
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    setInputText('');

    const myMsg = {
      id: Date.now().toString(), text, fromMe: true,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, myMsg]);
    await saveMessage(myMsg); // guardar en móvil

    try {
      const res = await fetch(`${VPS_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-token': token },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error('Error');
    } catch {
      Alert.alert('Error', 'No se pudo enviar. Comprueba la conexión.');
    } finally {
      setSending(false);
    }
  };

  const logout = async () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
        await AsyncStorage.multiRemove([storage.token, storage.username, storage.clientData]);
        if (socketRef.current) socketRef.current.disconnect();
        navigation.replace('Login');
      }},
    ]);
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.bubble, item.fromMe ? styles.bubbleOut : styles.bubbleIn]}>
      {!item.fromMe && <Text style={styles.senderName}>Suggy</Text>}
      <Text style={[styles.bubbleText, item.fromMe ? styles.bubbleTextOut : styles.bubbleTextIn]}>
        {item.text}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>🤖</Text>
          <View>
            <Text style={styles.headerName}>Suggy</Text>
            <Text style={[styles.headerStatus, connected ? styles.online : styles.offline]}>
              {connected ? (nombre ? `Hola, ${nombre}` : 'En línea') : 'Reconectando...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🤖</Text>
            <Text style={styles.emptyText}>
              {nombre ? `¡Hola, ${nombre}!` : '¡Hola!'}
            </Text>
            <Text style={styles.emptySubtext}>Soy Suggy. ¿En qué te puedo ayudar?</Text>
          </View>
        }
      />

      {typing && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>Suggy está escribiendo...</Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escribe a Suggy..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            color={colors.text}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendIcon}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:colors.surface, paddingHorizontal:16, paddingVertical:12, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft:       { flexDirection:'row', alignItems:'center' },
  headerEmoji:      { fontSize: 24, marginRight: 10 },
  headerName:       { fontSize: 18, fontWeight:'bold', color:colors.text },
  headerStatus:     { fontSize: 13 },
  online:           { color: '#10B981' }, 
  offline:          { color: colors.textMuted },
  logoutBtn:        { padding: 8 },
  logoutText:       { color: colors.error, fontWeight: '600' },
  messagesList:     { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
  emptyContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyEmoji:       { fontSize: 48, marginBottom: 16 },
  emptyText:        { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptySubtext:     { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  typingContainer:  { paddingHorizontal: 16, paddingBottom: 8 },
  typingText:       { color: colors.textMuted, fontStyle: 'italic', fontSize: 13 },
  bubble:           { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  bubbleIn:         { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleOut:        { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  senderName:       { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  bubbleText:       { fontSize: 16, lineHeight: 22 },
  bubbleTextIn:     { color: colors.text },
  bubbleTextOut:    { color: '#fff' },
  timestamp:        { fontSize: 10, alignSelf: 'flex-end', marginTop: 4, color: '#999' },
  inputRow:         { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input:            { flex: 1, backgroundColor: colors.background, color: colors.text, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100 },
  sendBtn:          { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  sendBtnDisabled:  { opacity: 0.5 },
  sendIcon:         { color: '#fff', fontSize: 18, marginLeft: 2 }
});
