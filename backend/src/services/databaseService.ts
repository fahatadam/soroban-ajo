import { prisma } from '../config/database';

export class DatabaseService {
  // User operations
  /**
   * Creates or updates a user record based on their Stellar wallet address.
   * 
   * @param walletAddress - The user's public Stellar wallet address
   * @returns Promise resolving to the created or updated user record
   */
  async upsertUser(walletAddress: string) {
    return prisma.user.upsert({
      where: { walletAddress },
      update: { updatedAt: new Date() },
      create: { walletAddress },
    });
  }

  /**
   * Retrieves a single user record by their wallet address.
   * 
   * @param walletAddress - The user's public Stellar wallet address
   * @returns Promise resolving to the user record or null if not found
   */
  async getUser(walletAddress: string) {
    return prisma.user.findUnique({
      where: { walletAddress },
    });
  }

  // Group operations
  /**
   * Creates or updates a savings group record with the provided configuration.
   * 
   * @param groupId - Unique identifier for the group
   * @param data - The group configuration details
   * @param data.name - Name of the group
   * @param data.contributionAmount - Amount each member must contribute per round
   * @param data.frequency - Contribution frequency in days
   * @param data.maxMembers - Maximum number of participants allowed
   * @param data.currentRound - The current round of the savings cycle
   * @param data.isActive - Whether the group is currently active
   * @returns Promise resolving to the upserted group record
   */
  async upsertGroup(groupId: string, data: {
    name: string;
    contributionAmount: bigint;
    frequency: number;
    maxMembers: number;
    currentRound?: number;
    isActive?: boolean;
  }) {
    return prisma.group.upsert({
      where: { id: groupId },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        id: groupId,
        ...data,
      },
    });
  }

  /**
   * Retrieves a group's details including its members and recent contributions.
   * 
   * @param groupId - The unique ID of the group
   * @returns Promise resolving to the group record with nested relations or null
   */
  async getGroup(groupId: string) {
    return prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: true } },
        contributions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  /**
   * Fetches all active savings groups currently stored in the database.
   * 
   * @returns Promise resolving to an array of active group records
   */
  async getAllGroups() {
    return prisma.group.findMany({
      where: { isActive: true },
      include: {
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Member operations
  /**
   * Assigns a user to a savings group as a member.
   * Ensures the user record exists before creating the membership.
   * 
   * @param groupId - The ID of the group to join
   * @param walletAddress - The user's public wallet address
   * @returns Promise resolving to the created or existing group membership record
   */
  async addGroupMember(groupId: string, walletAddress: string) {
    await this.upsertUser(walletAddress);
    return prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: walletAddress,
        },
      },
      update: {},
      create: {
        groupId,
        userId: walletAddress,
      },
    });
  }

  /**
   * Retrieves all members of a specific savings group.
   * 
   * @param groupId - The ID of the group
   * @returns Promise resolving to an array of group members with nested user data
   */
  async getGroupMembers(groupId: string) {
    return prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    });
  }

  // Contribution operations
  /**
   * Records a new contribution from a user to a specific group round.
   * 
   * @param data - The contribution details
   * @param data.groupId - The ID of the group
   * @param data.walletAddress - The user's public wallet address
   * @param data.amount - The contribution amount in smallest units
   * @param data.round - The round number this contribution belongs to
   * @param data.txHash - The blockchain transaction hash
   * @returns Promise resolving to the created contribution record
   */
  async addContribution(data: {
    groupId: string;
    walletAddress: string;
    amount: bigint;
    round: number;
    txHash: string;
  }) {
    await this.upsertUser(data.walletAddress);
    return prisma.contribution.create({
      data: {
        groupId: data.groupId,
        userId: data.walletAddress,
        amount: data.amount,
        round: data.round,
        txHash: data.txHash,
      },
    });
  }

  /**
   * Fetches contributions for a group, optionally filtered by a specific round.
   * 
   * @param groupId - The ID of the group
   * @param round - Optional round number to filter by
   * @returns Promise resolving to an array of contribution records
   */
  async getContributions(groupId: string, round?: number) {
    return prisma.contribution.findMany({
      where: {
        groupId,
        ...(round !== undefined && { round }),
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves a single contribution record by its blockchain transaction hash.
   * 
   * @param txHash - The unique blockchain transaction hash
   * @returns Promise resolving to the contribution record or null if not found
   */
  async getContributionByTxHash(txHash: string) {
    return prisma.contribution.findUnique({
      where: { txHash },
    });
  }
}

export const dbService = new DatabaseService();
