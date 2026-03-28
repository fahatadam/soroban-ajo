import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { OfflineBanner } from '../src/components/OfflineBanner';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize().finally(() => SplashScreen.hideAsync());
  }, []);

  if (isLoading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="groups/[id]/index" options={{ headerShown: true, title: 'Group Details' }} />
        <Stack.Screen name="groups/[id]/contribute" options={{ headerShown: true, title: 'Make Contribution' }} />
        <Stack.Screen name="groups/create" options={{ headerShown: true, title: 'Create Group' }} />
        <Stack.Screen name="qr" options={{ headerShown: true, title: 'Scan QR Code', presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
