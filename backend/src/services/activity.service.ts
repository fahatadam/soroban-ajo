import { pool } from "../config/database";
import {
  ActivityRecord,
  ActivityEventType,
  ActivityActor,
  ActivityMetadata,
  ActivityFeedQuery,
  ActivityFeedResponse,
} from "../types/activity.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ─── Service ──────────────────────────────────────────────────────────────────

export class ActivityService {

  // ── Record a new activity event ────────────────────────────────────────────

  /**
   * Persists a new activity record to the database.
   * This method should be called by other service modules (e.g., contributions, groups, disputes)
   * whenever a significant event occurs that should be reflected in the activity feed.
   * 
   * @param params - The activity details to record
   * @param params.eventType - Categorized type of the activity (e.g., 'contribution.made')
   * @param params.actor - Information about the user performing the action
   * @param params.groupId - The ID of the group where the activity took place
   * @param params.metadata - Optional structured data specific to the event type
   * @param params.txHash - Optional blockchain transaction hash associated with the event
   * @returns Promise resolving to the created ActivityRecord
   */
  async record(params: {
    eventType: ActivityEventType;
    actor: ActivityActor;
    groupId: string;
    metadata?: ActivityMetadata;
    txHash?: string;
  }): Promise<ActivityRecord> {
    const { eventType, actor, groupId, metadata = {}, txHash } = params;

    const { rows } = await pool.query<ActivityRecord>(
      `INSERT INTO activity_feed
         (event_type, actor_user_id, actor_display_name, actor_wallet_address,
          actor_avatar_url, group_id, metadata, tx_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING
         id,
         event_type        AS "eventType",
         jsonb_build_object(
           'userId',        actor_user_id,
           'displayName',   actor_display_name,
           'walletAddress', actor_wallet_address,
           'avatarUrl',     actor_avatar_url
         )                 AS actor,
         group_id          AS "groupId",
         metadata,
         tx_hash           AS "txHash",
         created_at        AS "createdAt"`,
      [
        eventType,
        actor.userId,
        actor.displayName,
        actor.walletAddress ?? null,
        actor.avatarUrl ?? null,
        groupId,
        JSON.stringify(metadata),
        txHash ?? null,
      ]
    );

    return rows[0];
  }

  // ── Query the feed ─────────────────────────────────────────────────────────

  /**
   * Fetches a paginated list of activity records based on the provided query filters.
   * Supports filtering by group, user, and event types with keyset-style pagination.
   * 
   * @param query - The filtering and pagination parameters
   * @param query.groupId - Filter by specific savings group
   * @param query.userId - Filter by specific user (actor)
   * @param query.eventTypes - Array of event types to include
   * @param query.limit - Maximum number of records to return (default: 20, max: 100)
   * @param query.page - Page number for pagination
   * @param query.before - Get records created before this ISO-8601 timestamp
   * @param query.after - Get records created after this ISO-8601 timestamp
   * @returns Promise resolving to the activity list and pagination metadata
   */
  async getFeed(query: ActivityFeedQuery): Promise<ActivityFeedResponse> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const page = Math.max(query.page ?? 1, 1);
    const offset = (page - 1) * limit;

    // ── Build dynamic WHERE clauses ─────────────────────────────────────────
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1; // param counter

    if (query.groupId) {
      conditions.push(`group_id = $${p++}`);
      params.push(query.groupId);
    }

    if (query.userId) {
      conditions.push(`actor_user_id = $${p++}`);
      params.push(query.userId);
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      conditions.push(`event_type = ANY($${p++})`);
      params.push(query.eventTypes);
    }

    if (query.before) {
      conditions.push(`created_at < $${p++}`);
      params.push(query.before);
    }

    if (query.after) {
      conditions.push(`created_at > $${p++}`);
      params.push(query.after);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // ── Count total (for pagination metadata) ───────────────────────────────
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM activity_feed ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    // ── Fetch page ──────────────────────────────────────────────────────────
    const dataParams = [...params, limit, offset];
    const { rows } = await pool.query<ActivityRecord>(
      `SELECT
         id,
         event_type        AS "eventType",
         jsonb_build_object(
           'userId',        actor_user_id,
           'displayName',   actor_display_name,
           'walletAddress', actor_wallet_address,
           'avatarUrl',     actor_avatar_url
         )                 AS actor,
         group_id          AS "groupId",
         metadata,
         tx_hash           AS "txHash",
         created_at        AS "createdAt"
       FROM activity_feed
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      dataParams
    );

    const hasMore = offset + rows.length < total;
    const nextCursor =
      hasMore && rows.length > 0
        ? rows[rows.length - 1].createdAt
        : undefined;

    return {
      activities: rows,
      pagination: { total, page, limit, hasMore, nextCursor },
    };
  }

  /**
   * Retrieves a single activity record by its unique identifier.
   * 
   * @param id - The unique ID of the activity record
   * @returns Promise resolving to the activity record or null if not found
   */
  async getById(id: string): Promise<ActivityRecord | null> {
    const { rows } = await pool.query<ActivityRecord>(
      `SELECT
         id,
         event_type        AS "eventType",
         jsonb_build_object(
           'userId',        actor_user_id,
           'displayName',   actor_display_name,
           'walletAddress', actor_wallet_address,
           'avatarUrl',     actor_avatar_url
         )                 AS actor,
         group_id          AS "groupId",
         metadata,
         tx_hash           AS "txHash",
         created_at        AS "createdAt"
       FROM activity_feed
       WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  /**
   * Generates a summary of activity event counts for a specific group over a given time period.
   * Often used for populating dashboard widgets or analytics charts.
   * 
   * @param groupId - The ID of the group to summarize
   * @param days - The lookback window in days (default: 30)
   * @returns Promise resolving to an object mapping event types to their respective counts
   */
  async getSummary(
    groupId: string,
    days = 30
  ): Promise<Record<string, number>> {
    const { rows } = await pool.query<{ event_type: string; count: string }>(
      `SELECT event_type, COUNT(*) AS count
         FROM activity_feed
        WHERE group_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY event_type`,
      [groupId]
    );

    return Object.fromEntries(rows.map((r: { event_type: string; count: string }) => [r.event_type, parseInt(r.count, 10)]))
  }
}

// Singleton export — import this in controllers and other services
export const activityService = new ActivityService();