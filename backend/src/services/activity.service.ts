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
   * Persist an activity record to the database.
   * Call this from other services (contributions, groups, disputes, etc.)
   * whenever a meaningful action occurs.
   *
   * Example:
   *   await activityService.record({
   *     eventType: "contribution.made",
   *     actor:     { userId, displayName, walletAddress },
   *     groupId,
   *     metadata:  { amount: "50", currency: "XLM", contributionRound: 3 },
   *     txHash,
   *   });
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
   * Fetch a paginated activity feed.
   *
   * Supports filtering by:
   *  - groupId     — all activity for a specific group
   *  - userId      — activity by or directly involving a specific user
   *  - eventTypes  — filter to a subset of event types
   *  - before/after cursor (ISO-8601) — for efficient keyset pagination
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

  // ── Get a single activity record ───────────────────────────────────────────

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

  // ── Get recent summary counts (for dashboard widgets) ─────────────────────

  /**
   * Returns event-type counts for a group over the last N days.
   * Useful for rendering a summary bar on the group dashboard.
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