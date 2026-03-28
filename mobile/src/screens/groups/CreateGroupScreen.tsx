import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { createGroup } from '../../services/api';
import { Colors, Spacing, Typography } from '../../constants/theme';

export function CreateGroupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    contributionAmount: '',
    maxMembers: '',
    cycleLength: '',
    frequency: 'monthly' as 'weekly' | 'monthly',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Group name is required';
    if (!form.contributionAmount || isNaN(Number(form.contributionAmount)))
      e.contributionAmount = 'Enter a valid amount';
    if (!form.maxMembers || isNaN(Number(form.maxMembers)) || Number(form.maxMembers) < 2)
      e.maxMembers = 'Minimum 2 members';
    if (!form.cycleLength || isNaN(Number(form.cycleLength)))
      e.cycleLength = 'Enter cycle length in days';
    return e;
  };

  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      const group = await createGroup({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        contributionAmount: Number(form.contributionAmount),
        maxMembers: Number(form.maxMembers),
        cycleLength: Number(form.cycleLength),
        frequency: form.frequency,
      });
      Alert.alert('Group Created', `"${group.name}" is ready.`, [
        { text: 'View Group', onPress: () => router.replace(`/groups/${group.id}`) },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Group Details</Text>

          <Input
            label="Group Name *"
            placeholder="e.g. Family Savings Circle"
            value={form.name}
            onChangeText={set('name')}
            error={errors.name}
          />
          <Input
            label="Description"
            placeholder="What is this group for?"
            value={form.description}
            onChangeText={set('description')}
            multiline
            numberOfLines={3}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Contribution Settings</Text>

          <Input
            label="Contribution Amount (XLM) *"
            placeholder="e.g. 100"
            value={form.contributionAmount}
            onChangeText={set('contributionAmount')}
            keyboardType="decimal-pad"
            error={errors.contributionAmount}
          />
          <Input
            label="Max Members *"
            placeholder="e.g. 10"
            value={form.maxMembers}
            onChangeText={set('maxMembers')}
            keyboardType="number-pad"
            error={errors.maxMembers}
          />
          <Input
            label="Cycle Length (days) *"
            placeholder="e.g. 30"
            value={form.cycleLength}
            onChangeText={set('cycleLength')}
            keyboardType="number-pad"
            error={errors.cycleLength}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Monthly frequency</Text>
            <Switch
              value={form.frequency === 'monthly'}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, frequency: v ? 'monthly' : 'weekly' }))
              }
              trackColor={{ true: Colors.primary }}
              accessibilityLabel="Toggle frequency between weekly and monthly"
            />
          </View>
          <Text style={styles.freqHint}>
            Currently: {form.frequency === 'monthly' ? 'Monthly' : 'Weekly'}
          </Text>
        </Card>

        <Button
          title="Create Group"
          onPress={handleCreate}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  card: { gap: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.surface[800] },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { ...Typography.body, color: Colors.surface[700] },
  freqHint: { ...Typography.caption, color: Colors.surface[400] },
  submitBtn: { width: '100%' },
});
