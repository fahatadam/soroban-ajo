import { PrismaClient } from '@prisma/client';
import { RewardEngine } from './RewardEngine';

/**
 * Service for tracking user actions and unlocking achievements
 */
export class AchievementTracker {
  constructor(
    private prisma: PrismaClient,
    private rewardEngine: RewardEngine
  ) {}

  /**
   * Handles the event when a user creates a new savings group.
   * Checks if this is the user's first group and unlocks the 'first_group_created' achievement if so.
   * 
   * @param userId - Unique identifier of the user who created the group
   * @param groupId - Unique identifier of the newly created group
   * @returns Promise resolving when processing is complete
   */
  async handleGroupCreation(userId: string, groupId: string): Promise<void> {
    // Check if this is user's first group
    const groupCount = await this.prisma.group.count({
      where: {
        members: {
          some: { userId },
        },
      },
    });

    if (groupCount === 1) {
      // First group created - unlock achievement
      await this.unlockAchievement(userId, 'first_group_created');
    }
  }

  /**
   * Handles the event when a user completes a contribution to a savings group.
   * Tracks the total number of contributions and unlocks achievements like 'ten_contributions'.
   * 
   * @param userId - Unique identifier of the user who made the contribution
   * @param contributionId - Unique identifier of the completed contribution
   * @returns Promise resolving when processing is complete
   */
  async handleContributionComplete(userId: string, contributionId: string): Promise<void> {
    // Increment successful contribution count
    const contributionCount = await this.prisma.contribution.count({
      where: { userId },
    });

    // Check for 10 contributions achievement
    if (contributionCount === 10) {
      await this.unlockAchievement(userId, 'ten_contributions');
    }
  }

  /**
   * Handles the event when a savings cycle is completed in a group.
   * Updates the user's contribution streak and unlocks performance-based achievements.
   * 
   * @param userId - Unique identifier of the user who completed the cycle
   * @param groupId - Unique identifier of the group where the cycle occurred
   * @param hadLatePayment - Flag indicating if the user had any late payments during this cycle
   * @returns Promise resolving when processing is complete
   */
  async handleCycleComplete(
    userId: string,
    groupId: string,
    hadLatePayment: boolean
  ): Promise<void> {
    // Get or create user gamification record
    const gamification = await this.prisma.userGamification.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    if (hadLatePayment) {
      // Reset perfect cycle count
      await this.prisma.userGamification.update({
        where: { userId },
        data: { contributionStreak: 0 },
      });
    } else {
      // Increment perfect cycle count
      const newStreak = (gamification.contributionStreak || 0) + 1;

      await this.prisma.userGamification.update({
        where: { userId },
        data: { contributionStreak: newStreak },
      });

      // Check for perfect attendance achievement (3 consecutive perfect cycles)
      if (newStreak === 3) {
        await this.unlockAchievement(userId, 'perfect_attendance');
      }
    }
  }

  /**
   * Handles the event when a referral is successfully completed.
   * Tracks the number of completed referrals and unlocks community-based achievements.
   * 
   * @param referrerId - Unique identifier of the user who made the referral
   * @returns Promise resolving when processing is complete
   */
  async handleReferralComplete(referrerId: string): Promise<void> {
    // Count completed referrals (where referee has made at least one contribution)
    const completedReferrals = await this.prisma.referral.count({
      where: {
        referrerId,
        status: 'COMPLETED',
      },
    });

    // Check for community helper achievement (5 completed referrals)
    if (completedReferrals === 5) {
      await this.unlockAchievement(referrerId, 'community_helper');
    }
  }

  /**
   * Unlocks a specific achievement for a user and records it in the database.
   * This internal method handles duplicate prevention, database storage, activity feed creation,
   * and reward distribution via the RewardEngine.
   * 
   * @param userId - Unique identifier of the user
   * @param achievementId - Programmatic name of the achievement to unlock
   * @returns Promise resolving when the achievement is successfully processed
   * @internal
   */
  private async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    // Check if achievement already unlocked
    const existing = await this.prisma.userAchievement.findFirst({
      where: {
        userId,
        achievement: {
          name: achievementId,
        },
      },
    });

    if (existing) {
      return; // Already unlocked
    }

    // Get achievement from database
    const achievement = await this.prisma.achievement.findUnique({
      where: { name: achievementId },
    });

    if (!achievement) {
      // Achievement doesn't exist in database yet
      // This would be seeded from the configuration
      return;
    }

    // Create achievement unlock record
    await this.prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    });

    // Create activity feed entry
    await this.prisma.activityFeed.create({
      data: {
        userId,
        type: 'ACHIEVEMENT',
        title: `Achievement Unlocked: ${achievement.name}`,
        description: achievement.description,
        metadata: JSON.stringify({ achievementId }),
      },
    });

    // Distribute achievement rewards
    await this.rewardEngine.distributeAchievementReward(userId, achievementId);
  }

  /**
   * Retrieves all achievements unlocked by a specific user.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise resolving to an array of user achievement records with associated achievement details
   */
  async getUserAchievements(userId: string): Promise<any[]> {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  /**
   * Calculates the current progress of a user towards a specific achievement.
   * Useful for UI displays of progress bars and 'locked' states.
   * 
   * @param userId - Unique identifier of the user
   * @param achievementId - Programmatic name of the achievement to check
   * @returns Promise resolving to progress details containing current value, required value, and unlock status
   */
  async getAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<{ current: number; required: number; unlocked: boolean }> {
    let current = 0;
    let required = 0;

    switch (achievementId) {
      case 'first_group_created':
        current = await this.prisma.group.count({
          where: {
            members: {
              some: { userId },
            },
          },
        });
        required = 1;
        break;

      case 'ten_contributions':
        current = await this.prisma.contribution.count({
          where: { userId },
        });
        required = 10;
        break;

      case 'perfect_attendance':
        const gamification = await this.prisma.userGamification.findUnique({
          where: { userId },
        });
        current = gamification?.contributionStreak || 0;
        required = 3;
        break;

      case 'community_helper':
        current = await this.prisma.referral.count({
          where: {
            referrerId: userId,
            status: 'COMPLETED',
          },
        });
        required = 5;
        break;
    }

    const unlocked = await this.prisma.userAchievement.findFirst({
      where: {
        userId,
        achievement: {
          name: achievementId,
        },
      },
    });

    return {
      current,
      required,
      unlocked: unlocked !== null,
    };
  }
}
