import { z } from 'zod'
import { idParamSchema, paginationSchema } from '../schemas/common.schema'

// Chat message schema
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']).optional().default('TEXT'),
  metadata: z.any().optional(), // For file URLs, image data, etc.
})

// Edit message schema
export const editMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
})

// Create chat room schema
export const createChatRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Room name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
})

// Chat pagination schema
export const chatPaginationSchema = paginationSchema

// Chat room ID param
export const chatRoomIdParamSchema = idParamSchema

// Message ID param
export const messageIdParamSchema = idParamSchema

// Type exports
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type EditMessageInput = z.infer<typeof editMessageSchema>
export type CreateChatRoomInput = z.infer<typeof createChatRoomSchema>
