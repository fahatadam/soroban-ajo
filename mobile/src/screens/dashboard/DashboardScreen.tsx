import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { Group } from '../../types';

export function DashboardScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { groups, isLoading, loadGroups } = useGroupStore();

  useEffect(() => {
    loadGroups(true);
  }, []);

  const myGroups = groups.filter(
    (g) => g.creator === session?.address || g.status === 'active',
  ).slice(0, 5);

  const shortAddress = session?.address
    ? `${session.address.slice(0, 6)}...${session.address.slice(-4)}`
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadGroups(true)} />}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>Welcome back</Text>
            <Text style={styles.address}>{shortAddress}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/qr')}
            style={styles.qrBtn}
            accessibilityLabel="Scan QR code"
          >
            <Ionicons name="qr-code-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatCard label="Active Groups" value={myGroups.filter((g) => g.status === 'active').length} icon="people" />
          <StatCard label="Total Saved" value={`${myGroups.reduce((s, g) => s + g.totalContributions, 0)} XLM`} icon="wallet" />
        </View>

        {/* My Groups */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {myGroups.length === 0 && !isLoading && (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={32} color={Colors.surface[300]} />
            <Text style={styles.emptyText}>No groups yet</Text>
            <TouchableOpacity onPress={() => router.push('/groups/create')}>
              <Text style={styles.createLink}>Create your first group →</Text>
            </TouchableOpacity>
          </Card>
        )}

        {myGroups.map((group) => (
          <GroupRow key={group.id} group={group} onPress={() => {
            router.push(`/groups/${group.id}`);
          }} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <Card style={statStyles.card}>
      <Ionicons name={`${icon}-outline` as any} size={22} color={Colors.primary} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </Card>
  );
}

function GroupRow({ group, onPress }: { group: Group; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${group.name}`}>
      <Card style={rowStyles.card}>
        <View style={rowStyles.left}>
          <Text style={rowStyles.name} numberOfLines={1}>{group.name}</Text>
          <Text style={rowStyles.meta}>
            {group.currentMembers}/{group.maxMembers} members · {group.contributionAmount} XLM
          </Text>
        </View>
        <Badge
          label={group.status}
          variant={group.status === 'active' ? 'success' : 'neutral'}
        />
      </Card>
    </TouchableOpacity>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  value: { ...Typography.h2, color: Colors.surface[900] },
  label: { ...Typography.caption, color: Colors.surface[500], textAlign: 'center' },
});

const rowStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flex: 1, gap: 2 },
  name: { ...Typography.label, color: Colors.surface[900] },
  meta: { ...Typography.caption, color: Colors.surface[500] },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingText: { ...Typography.h2, color: Colors.surface[900] },
  address: { ...Typography.bodySmall, color: Colors.surface[500], fontFamily: 'monospace' },
  qrBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...Typography.h3, color: Colors.surface[800] },
  seeAll: { ...Typography.bodySmall, color: Colors.primary },
  emptyCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.surface[400] },
  createLink: { ...Typography.label, color: Colors.primary },
});
