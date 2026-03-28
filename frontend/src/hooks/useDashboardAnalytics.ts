import { useMemo } from 'react';

/**
 * Aggregated metrics for the user's overall dashboard.
 */
export interface DashboardMetrics {
  totalSavings: number;
  totalContributions: number;
  totalPayouts: number;
  expectedPayouts: number;
  activeGroups: number;
  completedGroups: number;
  /** Average monthly savings rate based on total contributions */
  savingsRate: number;
}

export interface ContributionData {
  date: string;
  amount: number;
  groupName: string;
}

export interface GroupDistribution {
  name: string;
  value: number;
  percentage: number;
}

export interface SavingsGrowth {
  month: string;
  savings: number;
  contributions: number;
  payouts: number;
}

/**
 * AI-driven or heuristic insight for the user's financial health.
 */
export interface Insight {
  id: string;
  type: 'reminder' | 'goal' | 'recommendation' | 'warning';
  title: string;
  description: string;
  /** Optional CTA label for the insight */
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Hook to process raw group data into high-level dashboard analytics and insights.
 * Calculates savings growth, contribution distribution, and active alerts.
 * 
 * @param groups - Array of raw group objects from the blockchain
 * @returns Comprehensive analytics dashboard data structure
 */
export const useDashboardAnalytics = (groups: any[] = []) => {
  const metrics = useMemo<DashboardMetrics>(() => {
    // Mock calculations - replace with real data
    const totalContributions = groups.reduce(
      (sum, group) => sum + (group.totalContributed || 0),
      0
    );
    const totalPayouts = groups.reduce(
      (sum, group) => sum + (group.totalPayouts || 0),
      0
    );
    const activeGroups = groups.filter((g) => g.isActive).length;
    const completedGroups = groups.filter((g) => g.isComplete).length;

    return {
      totalSavings: totalContributions - totalPayouts,
      totalContributions,
      totalPayouts,
      expectedPayouts: groups.reduce(
        (sum, group) => sum + (group.expectedPayout || 0),
        0
      ),
      activeGroups,
      completedGroups,
      savingsRate: totalContributions / 12, // Monthly average
    };
  }, [groups]);

  const contributionHistory = useMemo<ContributionData[]>(() => {
    // Mock data - replace with real transaction history
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      date: month,
      amount: 100 + Math.random() * 200,
      groupName: 'Group ' + (i % 3 + 1),
    }));
  }, []);

  const groupDistribution = useMemo<GroupDistribution[]>(() => {
    const total = groups.reduce(
      (sum, group) => sum + (group.totalContributed || 0),
      0
    );
    return groups.slice(0, 5).map((group) => {
      const value = group.totalContributed || 0;
      return {
        name: group.name || 'Unnamed Group',
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      };
    });
  }, [groups]);

  const savingsGrowth = useMemo<SavingsGrowth[]>(() => {
    // Mock data - replace with real historical data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let cumulative = 0;
    return months.map((month) => {
      const contributions = 100 + Math.random() * 150;
      const payouts = Math.random() * 50;
      cumulative += contributions - payouts;
      return {
        month,
        savings: cumulative,
        contributions,
        payouts,
      };
    });
  }, []);

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    // Contribution reminders
    if (groups.some((g) => g.hasPendingContribution)) {
      result.push({
        id: 'reminder-1',
        type: 'reminder',
        title: 'Contribution Due',
        description: 'You have pending contributions in 2 groups',
        action: 'View Groups',
        priority: 'high',
      });
    }

    // Savings goals
    result.push({
      id: 'goal-1',
      type: 'goal',
      title: 'Savings Goal Progress',
      description: 'You\'re 75% towards your monthly savings goal',
      priority: 'medium',
    });

    // Recommendations
    if (groups.length < 3) {
      result.push({
        id: 'rec-1',
        type: 'recommendation',
        title: 'Diversify Your Savings',
        description: 'Consider joining more groups to spread your savings',
        action: 'Browse Groups',
        priority: 'low',
      });
    }

    return result;
  }, [groups]);

  return {
    metrics,
    contributionHistory,
    groupDistribution,
    savingsGrowth,
    insights,
  };
};
