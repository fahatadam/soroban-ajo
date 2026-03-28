/**
 * Command definitions — represent write-side intents.
 * Each command is a plain object describing what should happen.
 */

export interface CreateGroupCommand {
  type: 'CREATE_GROUP'
  payload: {
    name: string
    contributionAmount: bigint
    frequency: number
    maxMembers: number
    creatorWallet: string
  }
}

export interface JoinGroupCommand {
  type: 'JOIN_GROUP'
  payload: {
    groupId: string
    walletAddress: string
  }
}

export interface ContributeCommand {
  type: 'CONTRIBUTE'
  payload: {
    groupId: string
    walletAddress: string
    amount: bigint
    round: number
    txHash: string
  }
}

export interface CreateGoalCommand {
  type: 'CREATE_GOAL'
  payload: {
    userId: string
    title: string
    description?: string
    targetAmount: bigint
    deadline: Date
    category: string
    isPublic?: boolean
  }
}

export interface UpdateGoalCommand {
  type: 'UPDATE_GOAL'
  payload: {
    id: string
    userId: string
    title?: string
    description?: string
    targetAmount?: bigint
    deadline?: Date
    category?: string
    isPublic?: boolean
    status?: string
  }
}

export interface DeleteGoalCommand {
  type: 'DELETE_GOAL'
  payload: { id: string; userId: string }
}

export type Command =
  | CreateGroupCommand
  | JoinGroupCommand
  | ContributeCommand
  | CreateGoalCommand
  | UpdateGoalCommand
  | DeleteGoalCommand
