# Implement Group Chat Feature - PR #375

## Description
This PR implements a real-time chat functionality for group members to communicate within groups using Socket.IO and PostgreSQL.

## Changes

### Backend

#### Database Schema (prisma/schema.prisma)
- Added `ChatRoom` model - One chat room per group
- Added `ChatMessage` model - Stores all chat messages with support for TEXT, IMAGE, FILE, and SYSTEM types
- Added `ChatParticipant` model - Tracks user participation, read status, and notification preferences
- Created migration: `20260326201131_add_group_chat_feature`

#### Dependencies
- Installed `socket.io` and `@types/socket.io` for real-time WebSocket communication

#### Services
- **chatService.ts**: Complete Socket.IO service with:
  - Authentication middleware for WebSocket connections
  - Room management (join/leave)
  - Real-time message broadcasting
  - Typing indicators
  - Message editing and deletion
  - Participant management
  - Read/unread tracking

#### Controllers
- **chatController.ts**: RESTful API endpoints for:
  - `GET /api/chat/rooms/:groupId` - Get or create chat room
  - `GET /api/chat/rooms/:roomId/messages` - Get messages with pagination
  - `POST /api/chat/rooms/:roomId/messages` - Send a message
  - `PUT /api/chat/messages/:messageId` - Edit a message
  - `DELETE /api/chat/messages/:messageId` - Delete a message
  - `GET /api/chat/rooms/:roomId/participants` - Get participants
  - `POST /api/chat/rooms/:roomId/read` - Mark as read
  - `POST /api/chat/rooms/:roomId/mute` - Mute/unmute chat
  - `POST /api/chat/rooms/:roomId/notifications` - Toggle notifications

#### Routes
- **chat.ts**: Route definitions with Swagger documentation
- Updated **app.ts** to register chat routes and initialize Socket.IO server

#### Validators
- **chat.ts**: Zod schemas for request validation

### Frontend (To be implemented in next phase)
- Socket.IO client service
- Chat components (ChatWindow, ChatMessage, ChatInput)
- Integration into group detail page

## Technical Details

### WebSocket Events
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a new message
- `new_message` - Broadcast new message to room
- `typing_start` / `user_typing` - Typing indicators
- `typing_stop` / `user_stopped_typing` - Stop typing indicator
- `message_edited` - Broadcast edited message
- `message_deleted` - Broadcast deleted message
- `participant_joined` / `participant_left` - Room participant changes

### Security
- All chat routes require authentication via JWT token
- WebSocket authentication via wallet address
- Users can only access chats for groups they're members of
- Message editing/deletion restricted to message author

### Database Indexes
- Optimized for recent messages: `(roomId, createdAt DESC)`
- User message history: `(userId, createdAt DESC)`
- Participant lookup: `(roomId, userId)` unique constraint

## Testing

### Manual Testing Steps
1. Create a group or use existing test group
2. Join the group with multiple test users
3. Access chat room via API or frontend
4. Send messages between users
5. Verify real-time delivery
6. Test message editing and deletion
7. Test typing indicators
8. Test mute/unmute functionality
9. Test mark as read

### API Examples

```bash
# Get or create chat room
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/chat/rooms/<groupId>

# Get messages
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/chat/rooms/<roomId>/messages?page=1&limit=50"

# Send message
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!", "type": "TEXT"}' \
  http://localhost:3001/api/chat/rooms/<roomId>/messages
```

## Environment Variables
No new environment variables required. Socket.IO uses existing CORS settings from `FRONTEND_URL`.

## Migration Instructions
```bash
cd backend
npm install
npx prisma migrate deploy
npm run build
npm start
```

## Breaking Changes
None - This is a new feature with no impact on existing functionality.

## Future Enhancements
- File upload support for IMAGE/FILE message types
- Message reactions/emoticons
- Threaded conversations
- Search messages
- Admin moderation tools
- Chat analytics
- Push notifications for mentions

## Related Issues
- Closes #375

## Checklist
- [x] Database schema updated
- [x] Migration created
- [x] New dependencies added
- [x] Backend service implemented
- [x] API routes implemented
- [x] WebSocket real-time communication
- [x] Swagger documentation
- [ ] Frontend components (next phase)
- [ ] Unit tests (next phase)
- [ ] Integration tests (next phase)

## Notes
- The chat system automatically creates a chat room when a group member first accesses it
- Messages are soft-deleted (marked as deleted) rather than hard-deleted for audit purposes
- Socket.IO connection automatically reconnects on disconnect
- Read receipts are tracked per participant
