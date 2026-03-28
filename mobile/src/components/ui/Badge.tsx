import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#dcfce7', text: '#15803d' },
  warning: { bg: '#fef9c3', text: '#a16207' },
  error: { bg: '#fee2e2', text: '#b91c1c' },
  info: { bg: '#dbeafe', text: '#1d4ed8' },
  neutral: { bg: Colors.surface[100], text: Colors.surface[600] },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { bg, text } = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: { ...Typography.caption, fontWeight: '600' },
});
