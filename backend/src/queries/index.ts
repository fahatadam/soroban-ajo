/**
 * Query definitions — represent read-side requests.
 * Queries never mutate state.
 */

export interface GetGroupByIdQuery {
  type: 'GET_GROUP_BY_ID'
  payload: { id: string }
}

export interface ListGroupsQuery {
  type: 'LIST_GROUPS'
  payload: { page: number; limit: number; activeOnly?: boolean }
}

export interface GetGroupMembersQuery {
  type: 'GET_GROUP_MEMBERS'
  payload: { groupId: string }
}

export interface GetGoalByIdQuery {
  type: 'GET_GOAL_BY_ID'
  payload: { id: string }
}

export interface ListGoalsByUserQuery {
  type: 'LIST_GOALS_BY_USER'
  payload: { userId: string; status?: string }
}

export interface GetUserByWalletQuery {
  type: 'GET_USER_BY_WALLET'
  payload: { walletAddress: string }
}

export type Query =
  | GetGroupByIdQuery
  | ListGroupsQuery
  | GetGroupMembersQuery
  | GetGoalByIdQuery
  | ListGoalsByUserQuery
  | GetUserByWalletQuery
