import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, Typography } from '../../constants/theme';

/**
 * QR scanner for:
 * - Scanning a group invite QR code (deep link: ajo://groups/<id>)
 * - Scanning a Stellar address QR code
 */
export function QRScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera access is needed to scan QR codes.</Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Handle ajo:// deep links
    if (data.startsWith('ajo://groups/')) {
      const groupId = data.replace('ajo://groups/', '');
      router.replace(`/groups/${groupId}`);
      return;
    }

    // Handle raw Stellar address
    if (/^G[A-Z2-7]{55}$/.test(data)) {
      Alert.alert('Stellar Address', data, [
        { text: 'Copy', onPress: () => {} },
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    Alert.alert('Unknown QR Code', data, [
      { text: 'OK', onPress: () => setScanned(false) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.hint}>Point at a group invite or Stellar address QR code</Text>
          {scanned && (
            <Button
              title="Scan Again"
              onPress={() => setScanned(false)}
              variant="outline"
              style={styles.rescanBtn}
            />
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.black },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: { ...Typography.body, color: Colors.white, textAlign: 'center', paddingHorizontal: Spacing.xl },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  permissionText: { ...Typography.body, color: Colors.surface[700], textAlign: 'center' },
  rescanBtn: { backgroundColor: Colors.white },
});
