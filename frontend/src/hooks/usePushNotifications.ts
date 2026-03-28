'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/services/pushNotifications';
import { useNotifications } from './useNotifications';

export type PushStatus = 'unsupported' | 'default' | 'granted' | 'denied';

interface UsePushNotificationsReturn {
  status: PushStatus;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

/**
 * Hook for managing browser-level push notification subscriptions.
 * Handles service worker registration, permission checks, and VAPID key exchange.
 * 
 * @returns Object with subscription status, loading state, and control methods
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { setPushSubscription } = useNotifications();
  const [status, setStatus] = useState<PushStatus>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialise state from browser on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }

    setStatus(Notification.permission as PushStatus);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setIsSubscribed(true);
          setPushSubscription(sub);
        }
      })
      .catch(() => {});
  }, [setPushSubscription]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      await registerServiceWorker();
      const permission = await requestNotificationPermission();
      setStatus(permission as PushStatus);

      if (permission !== 'granted') return false;

      const subscription = await subscribeToPushNotifications();
      if (!subscription) return false;

      setPushSubscription(subscription);
      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setPushSubscription]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setPushSubscription(null);
        setIsSubscribed(false);
      }
      return success;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setPushSubscription]);

  return { status, isSubscribed, isLoading, subscribe, unsubscribe };
}
