'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from './useAuth'
import type { NotificationPayload } from './useNotifications'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketOptions {
  onNotification?: (notification: NotificationPayload) => void
}

interface UseWebSocketReturn {
  status: ConnectionStatus
  isConnected: boolean
  markRead: (notificationId: string) => void
}

/**
 * Hook to manage a real-time WebSocket connection for receiving notifications.
 * Automatically connects/disconnects based on authentication state.
 * Implements exponential backoff for reconnection on network failure.
 * 
 * @param options - Event handlers (e.g., onNotification)
 * @returns Connection status and manual control methods
 */
export function useWebSocket({ onNotification }: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { address, isAuthenticated } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const MAX_RECONNECT_DELAY = 30_000

  const connect = useCallback(() => {
    if (!isAuthenticated || !address) return
    if (socketRef.current?.connected) return

    setStatus('connecting')

    const socket = io(`${WS_URL}/notifications`, {
      auth: {
        walletAddress: address,
        userId: address, // walletAddress is the userId in this schema
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // we handle reconnection manually for backoff
    })

    socket.on('connect', () => {
      setStatus('connected')
      reconnectAttempts.current = 0
    })

    socket.on('notification', (payload: NotificationPayload) => {
      onNotification?.(payload)
    })

    socket.on('disconnect', (reason) => {
      setStatus('disconnected')
      // Auto-reconnect with exponential backoff unless intentional
      if (reason !== 'io client disconnect') {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, MAX_RECONNECT_DELAY)
        reconnectAttempts.current += 1
        reconnectTimerRef.current = setTimeout(() => connect(), delay)
      }
    })

    socket.on('connect_error', () => {
      setStatus('error')
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, MAX_RECONNECT_DELAY)
      reconnectAttempts.current += 1
      reconnectTimerRef.current = setTimeout(() => connect(), delay)
    })

    socketRef.current = socket
  }, [isAuthenticated, address, onNotification])

  useEffect(() => {
    if (isAuthenticated && address) {
      connect()
    } else {
      socketRef.current?.disconnect()
      socketRef.current = null
      setStatus('disconnected')
    }

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      socketRef.current?.disconnect()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, address])

  const markRead = useCallback((notificationId: string) => {
    socketRef.current?.emit('mark_read', { notificationId })
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    markRead,
  }
}
