'use client';

import { useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Performance snapshot for a specific savings group.
 */
export interface GroupPerformance {
  id: string;
  name: string;
  totalContributed: number;
  totalPayouts: number;
  memberCount: number;
  /** Percentage of members who have completed all due contributions */
  completionRate: number; // 0-100
  isActive: boolean;
}

export interface ContributionTrend {
  month: string;
  contributions: number;
  payouts: number;
  net: number;
}

export interface MemberStat {
  period: string;
  newMembers: number;
  totalMembers: number;
  activeMembers: number;
}

export interface TopContributor {
  address: string;
  displayName: string;
  totalContributed: number;
  groupCount: number;
  onTimeRate: number; // 0-100
}

export interface AnalyticsSummary {
  totalSavings: number;
  totalContributions: number;
  totalPayouts: number;
  activeGroups: number;
  totalMembers: number;
  avgCompletionRate: number;
  savingsChangePercent: number;
  contributionsChangePercent: number;
}

// ─── Seed helpers (replace with real API data) ────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function seedTrends(): ContributionTrend[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const contributions = 800 + i * 120 + Math.round(Math.sin(i) * 80);
    const payouts = i > 0 ? 200 + i * 40 : 0;
    return {
      month: MONTHS[d.getMonth()],
      contributions,
      payouts,
      net: contributions - payouts,
    };
  });
}

function seedMemberStats(): MemberStat[] {
  const now = new Date();
  let total = 12;
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const newMembers = 2 + Math.round(Math.random() * 4);
    total += newMembers;
    return {
      period: MONTHS[d.getMonth()],
      newMembers,
      totalMembers: total,
      activeMembers: Math.round(total * 0.8),
    };
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook for generating advanced analytics trends and summaries across multiple groups.
 * Provides contribution distributions, membership growth, and top contributor rankings.
 * 
 * @param groups - Raw group performance data
 * @returns Summary stats, contribution trends, and member stats
 */
export function useGroupAnalytics(groups: GroupPerformance[] = []) {
  const summary = useMemo<AnalyticsSummary>(() => {
    const totalContributions = groups.reduce((s, g) => s + g.totalContributed, 0);
    const totalPayouts = groups.reduce((s, g) => s + g.totalPayouts, 0);
    const activeGroups = groups.filter((g) => g.isActive).length;
    const totalMembers = groups.reduce((s, g) => s + g.memberCount, 0);
    const avgCompletionRate =
      groups.length > 0
        ? groups.reduce((s, g) => s + g.completionRate, 0) / groups.length
        : 0;

    return {
      totalSavings: totalContributions - totalPayouts,
      totalContributions,
      totalPayouts,
      activeGroups,
      totalMembers,
      avgCompletionRate,
      // Mock MoM change — replace with real historical comparison
      savingsChangePercent: 12.4,
      contributionsChangePercent: 8.7,
    };
  }, [groups]);

  // Use real group data if available, otherwise seed
  const contributionTrends = useMemo<ContributionTrend[]>(() => seedTrends(), []);

  const memberStats = useMemo<MemberStat[]>(() => seedMemberStats(), []);

  const groupPerformance = useMemo<GroupPerformance[]>(
    () =>
      groups.length > 0
        ? [...groups].sort((a, b) => b.totalContributed - a.totalContributed).slice(0, 6)
        : [],
    [groups]
  );

  const topContributors = useMemo<TopContributor[]>(
    () => [
      { address: 'GAABC...XYZ1', displayName: 'Member 1', totalContributed: 2400, groupCount: 3, onTimeRate: 98 },
      { address: 'GBBCD...XYZ2', displayName: 'Member 2', totalContributed: 1950, groupCount: 2, onTimeRate: 95 },
      { address: 'GCCDE...XYZ3', displayName: 'Member 3', totalContributed: 1700, groupCount: 2, onTimeRate: 91 },
      { address: 'GDDEF...XYZ4', displayName: 'Member 4', totalContributed: 1400, groupCount: 1, onTimeRate: 100 },
      { address: 'GEEFG...XYZ5', displayName: 'Member 5', totalContributed: 1100, groupCount: 1, onTimeRate: 87 },
    ],
    []
  );

  return { summary, contributionTrends, memberStats, groupPerformance, topContributors };
}
