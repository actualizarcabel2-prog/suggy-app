// ============================================================
// LoginScreen.js — Login + registro de clientes SuggyApp
// Usuario libre elegido por el cliente + contraseña fija cabel1n3
// Suggy recuerda el nombre y dirige así al cliente siempre
// VPS: 46.101.96.230 | /api/register
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VPS_URL, APP_PASSWORD, APP_CONFIG } from '../config';

const { colors, storage } = APP_CONFIG;

export default function LoginScreen({ navigation }) {
  const [nombre,   setNombre]   = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(true);
  const [modo,     setModo]     = useState('login'); // 'login' | 'registro'

  // Al abrir: verificar token guardado
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(storage.token);
        const user  = await AsyncStorage.getItem(storage.username);
        if (token && user) {
          const res = await fetch(`${VPS_URL}/api/status`, {
            headers: { 'x-session-token': token },
          });
          if (res.ok) { navigation.replace('Chat', { nombre: user }); return; }
          await AsyncStorage.multiRemove([storage.token, storage.username, storage.clientData]);
        }
      } catch (_) {}
      setChecking(false);
    })();
  }, []);

  const handleAcceder = async () => {
    if (!nombre.trim() || nombre.trim().length < 2) {
      Alert.alert('Error', 'Introduce tu nombre (mínimo 2 caracteres)');
      return;
    }
    if (password !== APP_PASSWORD) {
      Alert.alert('Contraseña incorrecta', 'Comprueba la contraseña e inténtalo de nuevo.');
      return;
    }
    setLoading(true);
    try {
      // /api/register registra al cliente si es nuevo, o devuelve su token si ya existe
      const res = await fetch(`${VPS_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        await AsyncStorage.setItem(storage.token,      data.token);
        await AsyncStorage.setItem(storage.username,   data.nombre);
        await AsyncStorage.setItem(storage.clientData, JSON.stringify({
          nombre:            data.nombre,
          fecha_alta:        data.fecha_alta,
          fecha_vencimiento: data.fecha_vencimiento,
          dias_restantes:    data.dias_restantes,
        }));
        navigation.replace('Chat', { nombre: data.nombre });
      } else {
        Alert.alert('No se puede acceder', data.error || 'Error desconocido');
      }
    } catch (e) {
      Alert.alert('Sin conexión', 'No se puede conectar con Suggy.\nComprueba tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.checkingText}>Conectando con Suggy...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>🤖</Text>
          <Text style={styles.title}>Suggy</Text>
          <Text style={styles.subtitle}>Tu asistente personal</Text>
        </View>

        {/* Nombre */}
        <Text style={styles.label}>Tu nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="¿Cómo te llamas?"
          placeholderTextColor={colors.textMuted}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* Contraseña */}
        <Text style={styles.label}>Contraseña de acceso</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleAcceder}
          returnKeyType="done"
          autoCapitalize="none"
        />

        {/* Info */}
        <Text style={styles.infoText}>
          Si es tu primera vez, Suggy te registrará automáticamente
          y recordará tu nombre en todas las conversaciones.
        </Text>

        {/* Botón */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAcceder}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Entrar con Suggy</Text>
          }
        </TouchableOpacity>

        <Text style={styles.vpsInfo}>Suggy · VPS 46.101.96.230 · 24/7</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  center:          { justifyContent: 'center', alignItems: 'center' },
  inner:           { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  avatarContainer: { alignItems: 'center', marginBottom: 40 },
  avatarEmoji:     { fontSize: 72, marginBottom: 8 },
  title:           { fontSize: 36, fontWeight: 'bold', color: colors.primary, letterSpacing: 2 },
  subtitle:        { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  label:           { color: colors.textMuted, fontSize: 12, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  input:           { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text },
  infoText:        { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  button:          { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  checkingText:    { color: colors.textMuted, marginTop: 16, fontSize: 14 },
  vpsInfo:         { textAlign: 'center', color: colors.textMuted, fontSize: 10, marginTop: 28 },
});
