import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../hooks/useOffline';
import { Colors, Spacing, Typography } from '../constants/theme';

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite" accessibilityLabel="You are offline">
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.white} />
      <Text style={styles.text}>You're offline — some features may be unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.surface[700],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  text: { ...Typography.caption, color: Colors.white },
});
