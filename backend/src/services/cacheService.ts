import { dbService } from './databaseService';
import { SorobanService } from './sorobanService';
import Redis from 'ioredis';

// initialize Redis client (will read from REDIS_URL or fallback to localhost)
export const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const sorobanService = new SorobanService();

/**
 * Example: Fetch group with caching
 * First checks database, falls back to blockchain if not found
 */
/**
 * Retrieves a savings group's details using a multi-layered caching strategy.
 * Priority: 1. Redis Cache -> 2. PostgreSQL Cache -> 3. Soroban Blockchain.
 * Populates upper cache layers on miss.
 * 
 * @param groupId - The unique identifier of the savings group
 * @returns Promise resolving to the group details
 * @throws {Error} If the group is not found on the blockchain
 */
export async function getGroupWithCache(groupId: string) {
  const redisKey = `group:${groupId}`;

  // 1. Redis
  const cachedRedis = await redisClient.get(redisKey);
  if (cachedRedis) {
    return JSON.parse(cachedRedis);
  }

  // 2. Postgres cache
  const cachedDb = await dbService.getGroup(groupId);
  if (cachedDb) {
    // warm redis for subsequent requests
    await redisClient.set(redisKey, JSON.stringify(cachedDb), 'EX', 60 * 5);
    return cachedDb;
  }

  // 3. Blockchain fallback
  const blockchainData = await sorobanService.getGroup(groupId);
  if (!blockchainData) {
    throw new Error('Group not found on blockchain');
  }

  // Persist to db cache
  const freqString = blockchainData.frequency || 'monthly';
  let frequencyInt = 30; // default to 30 days
  if (freqString === 'daily') frequencyInt = 1;
  else if (freqString === 'weekly') frequencyInt = 7;

  const upserted = await dbService.upsertGroup(groupId, {
    name: blockchainData.name,
    contributionAmount: BigInt(blockchainData.contributionAmount),
    frequency: frequencyInt,
    maxMembers: blockchainData.maxMembers,
    isActive: blockchainData.isActive,
  });

  // Also cache in Redis
  await redisClient.set(redisKey, JSON.stringify(upserted), 'EX', 60 * 5);

  return upserted;
}

/**
 * Persists a contribution record to the database cache if it doesn't already exist.
 * Typically called after a successful blockchain transaction is detected.
 * 
 * @param groupId - ID of the savings group
 * @param walletAddress - Public key of the contributor
 * @param amount - Contribution amount in smallest units
 * @param round - The savings cycle round number
 * @param txHash - The blockchain transaction hash
 * @returns Promise resolving to the contribution record
 */
export async function recordContribution(
  groupId: string,
  walletAddress: string,
  amount: bigint,
  round: number,
  txHash: string
) {
  // Check if already cached
  const existing = await dbService.getContributionByTxHash(txHash);
  if (existing) {
    return existing;
  }

  // Cache the contribution
  return dbService.addContribution({
    groupId,
    walletAddress,
    amount,
    round,
    txHash,
  });
}

/**
 * Retrieves all savings groups directly from the database cache.
 * Faster than querying the blockchain for broad listings.
 * 
 * @returns Promise resolving to an array of all cached groups
 */
export async function getAllGroupsFast() {
  return dbService.getAllGroups();
}

// Generic Redis helpers exposed for middleware or other services
/**
 * Generic helper to set a string value in the Redis cache with a TTL.
 * 
 * @param key - The cache key
 * @param value - The string value to store
 * @param ttlSeconds - Time-to-live in seconds (default: 60)
 * @returns Promise resolving when the value is set
 */
export async function cacheSet(key: string, value: string, ttlSeconds = 60) {
  return redisClient.set(key, value, 'EX', ttlSeconds);
}

/**
 * Generic helper to retrieve a string value from the Redis cache.
 * 
 * @param key - The cache key
 * @returns Promise resolving to the cached string or null if not found
 */
export async function cacheGet(key: string): Promise<string | null> {
  return redisClient.get(key);
}

/**
 * Generic helper to delete a key from the Redis cache.
 * 
 * @param key - The cache key to remove
 * @returns Promise resolving when the key is deleted
 */
export async function cacheDel(key: string) {
  return redisClient.del(key);
}
