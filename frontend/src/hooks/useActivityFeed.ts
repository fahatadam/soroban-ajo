import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { ActivityFeedResponse, ActivityEventType } from "@/types/activity.types";
import { backendApiClient } from "@/lib/apiClient";
import { apiPaths } from "@/lib/apiEndpoints";

interface FetchFeedParams {
  groupId?: string;
  userId?: string;
  eventTypes?: ActivityEventType[];
  limit?: number;
  page?: number;
  before?: string;
}

function buildActivityQuery(params: FetchFeedParams): string {
  const path = apiPaths.activity.feed(params.groupId);
  const url = new URL(path, "http://localhost");
  if (params.userId) url.searchParams.set("userId", params.userId);
  if (params.eventTypes)
    url.searchParams.set("eventTypes", params.eventTypes.join(","));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.before) url.searchParams.set("before", params.before);
  const q = url.search;
  return q ? `${path}${q}` : path;
}

async function fetchActivityFeed(
  params: FetchFeedParams,
  token: string
): Promise<ActivityFeedResponse> {
  return backendApiClient.request<ActivityFeedResponse>({
    path: buildActivityQuery(params),
    bearerToken: token,
  });
}

interface UseActivityFeedParams extends FetchFeedParams {
  token: string;
  enabled?: boolean;
}

/**
 * Hook for fetching a single page of activity events for a group or user.
 * 
 * @param params - Query filters (groupId, userId, eventTypes)
 * @param params.token - JWT bearer token for backend auth
 * @returns Query result with activity data
 */
export function useActivityFeed({
  token,
  enabled = true,
  ...params
}: UseActivityFeedParams) {
  return useQuery({
    queryKey: ["activityFeed", params],
    queryFn: () => fetchActivityFeed(params, token),
    enabled: enabled && !!token,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Hook for infinite-scroll activity feed using cursor-based pagination.
 * 
 * @param params - Query filters and auth token
 * @returns Infinite query result with fetchNextPage capabilities
 */
export function useInfiniteActivityFeed({
  token,
  enabled = true,
  ...params
}: UseActivityFeedParams) {
  return useInfiniteQuery({
    queryKey: ["activityFeedInfinite", params],
    queryFn: ({ pageParam }) =>
      fetchActivityFeed(
        { ...params, before: pageParam as string | undefined },
        token
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    enabled: enabled && !!token,
    staleTime: 30_000,
  });
}

interface ActivitySummary {
  groupId: string;
  days: number;
  summary: Record<string, number>;
}

export function useGroupActivitySummary(
  groupId: string,
  token: string,
  days = 30
) {
  return useQuery<ActivitySummary>({
    queryKey: ["activitySummary", groupId, days],
    queryFn: () =>
      backendApiClient.request<ActivitySummary>({
        path: apiPaths.activity.summary(groupId, days),
        bearerToken: token,
      }),
    enabled: !!groupId && !!token,
    staleTime: 5 * 60_000,
  });
}
