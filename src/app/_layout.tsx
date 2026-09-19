import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '@/context/AppContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { PaymentsProvider } from '@/context/PaymentsContext';

import { SheetHost } from '../components/ui/Sheet';
import { ToastHost } from '../components/ui/Toast';

import '../global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <PaymentsProvider>
            <AppProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#08050f' }, animation: 'fade' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="dialing" options={{ animation: 'fade' }} />
                <Stack.Screen name="call" options={{ animation: 'slide_from_bottom' }} />
              </Stack>
              <ToastHost />
              <SheetHost />
            </AppProvider>
          </PaymentsProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
