import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../../store/groupStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { Group } from '../../types';

export function GroupsScreen() {
  const router = useRouter();
  const { groups, isLoading, loadGroups, setSelectedGroup } = useGroupStore();
  const [search, setSearch] = React.useState('');

  useEffect(() => {
    loadGroups(true);
  }, []);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleGroupPress = useCallback(
    (group: Group) => {
      setSelectedGroup(group);
      router.push(`/groups/${group.id}`);
    },
    [router, setSelectedGroup],
  );

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      onPress={() => handleGroupPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Open group ${item.name}`}
    >
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          <Badge
            label={item.status}
            variant={item.status === 'active' ? 'success' : item.status === 'paused' ? 'warning' : 'neutral'}
          />
        </View>
        {item.description && (
          <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.groupMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={Colors.surface[500]} />
            <Text style={styles.metaText}>{item.currentMembers}/{item.maxMembers}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={Colors.surface[500]} />
            <Text style={styles.metaText}>{item.contributionAmount} XLM</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.surface[500]} />
            <Text style={styles.metaText}>{item.frequency ?? 'monthly'}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Button
          title="Create"
          onPress={() => router.push('/groups/create')}
          size="sm"
          style={styles.createBtn}
        />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.surface[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor={Colors.surface[400]}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search groups"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadGroups(true)} />
        }
        onEndReached={() => loadGroups()}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.surface[300]} />
              <Text style={styles.emptyText}>No groups found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.h2, color: Colors.surface[900] },
  createBtn: { minWidth: 80 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surface[200],
    paddingHorizontal: Spacing.md,
  },
  searchIcon: { marginRight: Spacing.xs },
  searchInput: { flex: 1, ...Typography.body, color: Colors.surface[900], paddingVertical: Spacing.sm },
  list: { padding: Spacing.lg, gap: Spacing.md },
  groupCard: { gap: Spacing.sm },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  groupName: { ...Typography.h3, color: Colors.surface[900], flex: 1 },
  groupDesc: { ...Typography.bodySmall, color: Colors.surface[500] },
  groupMeta: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption, color: Colors.surface[500] },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.surface[400] },
});
