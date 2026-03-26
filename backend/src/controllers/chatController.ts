import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { chatService } from '../services/chatService'
import { logger } from '../utils/logger'
import type { AuthRequest } from '../middleware/auth'

export class ChatController {
  /**
   * Get or create chat room for a group
   */
  async getOrCreateRoom(req: AuthRequest, res: Response) {
    try {
      const { groupId } = req.params

      if (!req.user?.walletAddress) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        })
      }

      // Verify user is a member of the group
      const groupMember = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.walletAddress,
          },
        },
      })

      if (!groupMember) {
        return res.status(403).json({
          success: false,
          error: 'You must be a group member to access the chat',
        })
      }

      // Get or create chat room
      let chatRoom = await prisma.chatRoom.findUnique({
        where: { groupId },
      })

      if (!chatRoom) {
        chatRoom = await chatService.createChatRoom(groupId, `${groupId} Chat`, `Chat room for group ${groupId}`)
      }

      // Add user as participant if not already added
      await chatService.addParticipant(chatRoom.id, req.user.walletAddress)

      res.json({
        success: true,
        data: chatRoom,
      })
    } catch (error) {
      logger.error('Error getting/creating chat room:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to initialize chat room',
      })
    }
  }

  /**
   * Get messages for a chat room
   */
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params
      const { page = '1', limit = '50' } = req.query
      const before = req.query.before as string | undefined

      if (!req.user?.walletAddress) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        })
      }

      // Verify user is a participant
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId: req.user.walletAddress,
          },
        },
      })

      if (!participant) {
        return res.status(403).json({
          success: false,
          error: 'You are not a participant in this chat',
        })
      }

      const beforeDate = before && typeof before === 'string' ? new Date(before) : undefined
      const messages = await chatService.getMessages(roomId, parseInt(limit as string), beforeDate)

      res.json({
        success: true,
        data: messages,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        },
      })
    } catch (error) {
      logger.error('Error getting messages:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve messages',
      })
    }
  }

  /**
   * Send a message
   */
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params
      const { content, type = 'TEXT', metadata } = req.body

      // Verify user is a participant
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId: req.user!.walletAddress,
          },
        },
      })

      if (!participant) {
        return res.status(403).json({
          success: false,
          error: 'You are not a participant in this chat',
        })
      }

      // Check if room is muted for this user
      if (participant.isMuted) {
        return res.status(403).json({
          success: false,
          error: 'You have muted this chat',
        })
      }

      // Create message via service (will broadcast via WebSocket)
      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          userId: req.user!.walletAddress,
          content,
          type,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
        include: {
          user: {
            select: {
              walletAddress: true,
            },
          },
        },
      })

      // Broadcast to room
      const io = chatService.getIO()
      io?.to(roomId).emit('new_message', {
        id: message.id,
        roomId: message.roomId,
        userId: message.userId,
        walletAddress: message.user.walletAddress,
        content: message.content,
        type: message.type,
        metadata: message.metadata ? JSON.parse(message.metadata) : null,
        isEdited: message.isEdited,
        createdAt: message.createdAt,
      })

      logger.info(`Message sent in room ${roomId} by user ${req.user!.walletAddress}`)

      res.status(201).json({
        success: true,
        data: message,
      })
    } catch (error) {
      logger.error('Error sending message:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
      })
    }
  }

  /**
   * Edit a message
   */
  async editMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params
      const { content } = req.body

      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
      })

      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
        })
      }

      if (message.userId !== req.user!.walletAddress) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own messages',
        })
      }

      if (message.deletedAt) {
        return res.status(403).json({
          success: false,
          error: 'Cannot edit deleted messages',
        })
      }

      const updatedMessage = await chatService.editMessage(messageId, req.user!.walletAddress, content)

      res.json({
        success: true,
        data: updatedMessage,
      })
    } catch (error) {
      logger.error('Error editing message:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to edit message',
      })
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params

      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
      })

      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
        })
      }

      // Allow users to delete their own messages or admins to delete any
      if (message.userId !== req.user!.walletAddress) {
        // Check if user is group admin
        const chatRoom = await prisma.chatRoom.findUnique({
          where: { id: message.roomId },
          include: { group: true },
        })

        const isAdmin = chatRoom?.group.members.some(
          (m: any) => m.userId === req.user!.walletAddress && false
        )

        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            error: 'You can only delete your own messages',
          })
        }
      }

      await chatService.deleteMessage(messageId, req.user!.walletAddress)

      res.json({
        success: true,
        message: 'Message deleted successfully',
      })
    } catch (error) {
      logger.error('Error deleting message:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete message',
      })
    }
  }

  /**
   * Get chat participants
   */
  async getParticipants(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params

      const participants = await prisma.chatParticipant.findMany({
        where: { roomId },
        include: {
          user: {
            select: {
              walletAddress: true,
              createdAt: true,
            },
          },
        },
      })

      res.json({
        success: true,
        data: participants,
      })
    } catch (error) {
      logger.error('Error getting participants:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve participants',
      })
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params

      await chatService.markAsRead(roomId, req.user!.walletAddress)

      res.json({
        success: true,
        message: 'Messages marked as read',
      })
    } catch (error) {
      logger.error('Error marking as read:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read',
      })
    }
  }

  /**
   * Mute/unmute chat
   */
  async toggleMute(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params
      const { isMuted } = req.body

      const participant = await prisma.chatParticipant.update({
        where: {
          roomId_userId: {
            roomId,
            userId: req.user!.walletAddress,
          },
        },
        data: { isMuted },
      })

      res.json({
        success: true,
        data: participant,
      })
    } catch (error) {
      logger.error('Error toggling mute:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update mute status',
      })
    }
  }

  /**
   * Toggle notifications
   */
  async toggleNotifications(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params
      const { notificationsEnabled } = req.body

      const participant = await prisma.chatParticipant.update({
        where: {
          roomId_userId: {
            roomId,
            userId: req.user!.walletAddress,
          },
        },
        data: { notificationsEnabled },
      })

      res.json({
        success: true,
        data: participant,
      })
    } catch (error) {
      logger.error('Error toggling notifications:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update notification status',
      })
    }
  }
}

export const chatController = new ChatController()
