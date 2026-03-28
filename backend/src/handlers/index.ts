import { prisma } from '../config/database'
import { CommandBus, CreateGoalHandler, UpdateGoalHandler, DeleteGoalHandler, ContributeHandler } from './commandHandlers'
import {
  QueryBus,
  GetGoalByIdHandler,
  ListGoalsByUserHandler,
  GetGroupByIdHandler,
  ListGroupsHandler,
  GetGroupMembersHandler,
  GetUserByWalletHandler,
} from './queryHandlers'

export function createCommandBus(): CommandBus {
  return new CommandBus()
    .register('CREATE_GOAL', new CreateGoalHandler(prisma))
    .register('UPDATE_GOAL', new UpdateGoalHandler(prisma))
    .register('DELETE_GOAL', new DeleteGoalHandler(prisma))
    .register('CONTRIBUTE', new ContributeHandler(prisma))
}

export function createQueryBus(): QueryBus {
  return new QueryBus()
    .register('GET_GOAL_BY_ID', new GetGoalByIdHandler(prisma))
    .register('LIST_GOALS_BY_USER', new ListGoalsByUserHandler(prisma))
    .register('GET_GROUP_BY_ID', new GetGroupByIdHandler(prisma))
    .register('LIST_GROUPS', new ListGroupsHandler(prisma))
    .register('GET_GROUP_MEMBERS', new GetGroupMembersHandler(prisma))
    .register('GET_USER_BY_WALLET', new GetUserByWalletHandler(prisma))
}

export { CommandBus, QueryBus }
export * from './commandHandlers'
export * from './queryHandlers'
