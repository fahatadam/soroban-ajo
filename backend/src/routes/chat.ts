import { Router } from 'express'
import { chatController } from '../controllers/chatController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { sendMessageSchema, editMessageSchema, chatPaginationSchema, chatRoomIdParamSchema, messageIdParamSchema } from '../validators/chat'

const router = Router()

// All chat routes require authentication
router.use(authenticate)

/**
 * @swagger
 * /api/chat/rooms/{groupId}:
 *   get:
 *     tags: [Chat]
 *     summary: Get or create chat room for a group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat room retrieved or created
 */
router.get('/rooms/:groupId', chatController.getOrCreateRoom.bind(chatController))

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get messages for a chat room
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get(
  '/rooms/:roomId/messages',
  validateRequest({
    params: chatRoomIdParamSchema,
    query: chatPaginationSchema,
  }),
  chatController.getMessages.bind(chatController)
)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, FILE, SYSTEM]
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post(
  '/rooms/:roomId/messages',
  validateRequest({
    params: chatRoomIdParamSchema,
    body: sendMessageSchema,
  }),
  chatController.sendMessage.bind(chatController)
)

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   put:
 *     tags: [Chat]
 *     summary: Edit a message
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message edited successfully
 */
router.put(
  '/messages/:messageId',
  validateRequest({
    params: messageIdParamSchema,
    body: editMessageSchema,
  }),
  chatController.editMessage.bind(chatController)
)

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   delete:
 *     tags: [Chat]
 *     summary: Delete a message
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 */
router.delete('/messages/:messageId', chatController.deleteMessage.bind(chatController))

/**
 * @swagger
 * /api/chat/rooms/{roomId}/participants:
 *   get:
 *     tags: [Chat]
 *     summary: Get chat participants
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 */
router.get('/rooms/:roomId/participants', chatController.getParticipants.bind(chatController))

/**
 * @swagger
 * /api/chat/rooms/{roomId}/read:
 *   post:
 *     tags: [Chat]
 *     summary: Mark messages as read
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post('/rooms/:roomId/read', chatController.markAsRead.bind(chatController))

/**
 * @swagger
 * /api/chat/rooms/{roomId}/mute:
 *   post:
 *     tags: [Chat]
 *     summary: Mute/unmute chat
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isMuted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Mute status updated
 */
router.post('/rooms/:roomId/mute', chatController.toggleMute.bind(chatController))

/**
 * @swagger
 * /api/chat/rooms/{roomId}/notifications:
 *   post:
 *     tags: [Chat]
 *     summary: Toggle notifications
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification status updated
 */
router.post('/rooms/:roomId/notifications', chatController.toggleNotifications.bind(chatController))

export const chatRouter = router
