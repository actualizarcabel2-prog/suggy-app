// ============================================================
// App.js — SuggyApp punto de entrada
// Suggy = bot WhatsApp 24/7 en VPS DigitalOcean 46.101.96.230
// ============================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen  from './src/screens/ChatScreen';
import { APP_CONFIG } from './src/config';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: APP_CONFIG.colors.background },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Chat"  component={ChatScreen}  />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
