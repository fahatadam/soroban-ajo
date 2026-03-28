import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { STELLAR_NETWORK } from '../../constants/api';

const FREIGHTER_MOBILE_URL = 'https://freighter.app';

export function WalletConnectScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [manualAddress, setManualAddress] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [addressError, setAddressError] = useState('');

  const isValidStellarAddress = (addr: string) =>
    /^G[A-Z2-7]{55}$/.test(addr.trim());

  const handleFreighterDeepLink = async () => {
    // Freighter Mobile uses a deep link / WalletConnect flow
    const url = `freighter://connect?callback=ajo://auth&network=${STELLAR_NETWORK}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Freighter Not Installed',
        'Download Freighter Mobile to connect your Stellar wallet.',
        [
          { text: 'Download', onPress: () => Linking.openURL(FREIGHTER_MOBILE_URL) },
          { text: 'Enter Address Manually', onPress: () => setShowManual(true) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  };

  const handleManualConnect = async () => {
    clearError();
    const addr = manualAddress.trim();
    if (!isValidStellarAddress(addr)) {
      setAddressError('Enter a valid Stellar public key (starts with G)');
      return;
    }
    setAddressError('');

    // Optionally prompt biometric before connecting
    const biometricAvailable = await LocalAuthentication.hasHardwareAsync();
    if (biometricAvailable) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm your identity to connect wallet',
        fallbackLabel: 'Use Passcode',
      });
      if (!result.success) return;
    }

    try {
      await login(addr, 'freighter', STELLAR_NETWORK);
      router.replace('/(tabs)');
    } catch {
      // error shown via store
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo / Hero */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.title}>Welcome to Ajo</Text>
          <Text style={styles.subtitle}>
            Decentralized savings groups on the Stellar network
          </Text>
        </View>

        {/* Connect options */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Connect Your Wallet</Text>

          <Button
            title="Connect with Freighter"
            onPress={handleFreighterDeepLink}
            size="lg"
            style={styles.walletBtn}
          />

          <Button
            title="Enter Address Manually"
            onPress={() => setShowManual(!showManual)}
            variant="outline"
            size="lg"
            style={styles.walletBtn}
          />

          {showManual && (
            <View style={styles.manualSection}>
              <Input
                label="Stellar Public Key"
                placeholder="GABC...XYZ"
                value={manualAddress}
                onChangeText={setManualAddress}
                error={addressError}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Button
                title="Connect"
                onPress={handleManualConnect}
                loading={isLoading}
                style={{ marginTop: Spacing.sm }}
              />
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </Card>

        <Text style={styles.disclaimer}>
          Ajo never stores your private keys. Your wallet remains in your control.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },
  scroll: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.xl },
  hero: { alignItems: 'center', gap: Spacing.md },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { ...Typography.h1, color: Colors.white },
  title: { ...Typography.h1, color: Colors.surface[900], textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.surface[500], textAlign: 'center' },
  card: { gap: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.surface[800] },
  walletBtn: { width: '100%' },
  manualSection: { gap: Spacing.sm },
  errorText: { ...Typography.bodySmall, color: Colors.error, textAlign: 'center' },
  disclaimer: {
    ...Typography.caption,
    color: Colors.surface[400],
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
