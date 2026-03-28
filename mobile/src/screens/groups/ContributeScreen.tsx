import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { contribute } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, Typography } from '../../constants/theme';

export function ContributeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { selectedGroup } = useGroupStore();
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const group = selectedGroup;
  if (!group) return null;

  const handleContribute = async () => {
    // Require biometric confirmation for financial transactions
    const biometricAvailable = await LocalAuthentication.hasHardwareAsync();
    if (biometricAvailable) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirm contribution of ${group.contributionAmount} XLM`,
        fallbackLabel: 'Use Passcode',
      });
      if (!result.success) return;
    }

    setLoading(true);
    try {
      // In production: build XDR via Soroban, sign via Freighter Mobile deep link
      // For now we submit with a placeholder signed XDR
      await contribute(group.id, group.contributionAmount, 'SIGNED_XDR_PLACEHOLDER');
      Alert.alert('Success', 'Contribution submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Contribution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.summaryCard}>
          <Text style={styles.label}>Group</Text>
          <Text style={styles.value}>{group.name}</Text>

          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>{group.contributionAmount} XLM</Text>

          <Text style={styles.label}>From Wallet</Text>
          <Text style={styles.value} numberOfLines={1}>
            {session?.address ?? '—'}
          </Text>
        </Card>

        <Card style={styles.infoCard} padding="sm">
          <Text style={styles.infoText}>
            Your contribution will be recorded on the Stellar blockchain via a Soroban smart contract.
            Biometric confirmation is required to authorize the transaction.
          </Text>
        </Card>

        <Button
          title={`Contribute ${group.contributionAmount} XLM`}
          onPress={handleContribute}
          loading={loading}
          size="lg"
          style={styles.btn}
        />
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="ghost"
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  summaryCard: { gap: Spacing.sm },
  label: { ...Typography.caption, color: Colors.surface[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { ...Typography.body, color: Colors.surface[800] },
  amount: { ...Typography.h2, color: Colors.primary },
  infoCard: { backgroundColor: Colors.surface[50] },
  infoText: { ...Typography.bodySmall, color: Colors.surface[500], lineHeight: 20 },
  btn: { width: '100%' },
});
