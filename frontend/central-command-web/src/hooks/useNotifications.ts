import { useEffect, useCallback } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { NotificationType, NotificationPriority } from '../types/notification.types';
import { useIncidentStore } from '../stores/useIncidentStore';
import { usePortalStore } from '../stores/usePortalStore';

/**
 * Custom hook for notification system
 */
export function useNotifications() {
  const {
    notifications,
    unreadCount,
    notificationsPanelOpen,
    addNotification,
    removeNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    toggleNotificationsPanel,
    showToast
  } = useUIStore();

  // Monitor incidents for notifications
  const incidents = useIncidentStore(state => state.incidents);
  const activeIncidents = useIncidentStore(state => state.activeIncidents);

  // Monitor portals for notifications
  const portals = usePortalStore(state => state.portals);

  // Check for critical incidents
  useEffect(() => {
    const criticalIncidents = activeIncidents.filter(i => i.severity === 'critical');

    criticalIncidents.forEach(incident => {
      // Check if notification already exists for this incident
      const existingNotification = notifications.find(n =>
        n.actionUrl === `/incidents/${incident.id}`
      );

      if (!existingNotification) {
        addNotification({
          type: NotificationType.ERROR,
          priority: NotificationPriority.HIGH,
          title: 'Critical Incident',
          message: incident.title,
          actionUrl: `/incidents/${incident.id}`,
          actionLabel: 'View Incident'
        });
      }
    });
  }, [activeIncidents, notifications, addNotification]);

  // Check for portal outages
  useEffect(() => {
    const outagePortals = portals.filter(p => p.status === 'outage');

    outagePortals.forEach(portal => {
      // Check if notification already exists for this portal
      const existingNotification = notifications.find(n =>
        n.actionUrl === `/portals/${portal.id}`
      );

      if (!existingNotification) {
        addNotification({
          type: NotificationType.WARNING,
          priority: NotificationPriority.HIGH,
          title: 'Portal Outage',
          message: `${portal.name} is experiencing an outage`,
          actionUrl: `/portals/${portal.id}`,
          actionLabel: 'View Portal'
        });
      }
    });
  }, [portals, notifications, addNotification]);

  // Helper functions
  const showSuccess = useCallback((title: string, message: string) => {
    showToast(NotificationType.SUCCESS, title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message: string) => {
    showToast(NotificationType.ERROR, title, message);
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string) => {
    showToast(NotificationType.WARNING, title, message);
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string) => {
    showToast(NotificationType.INFO, title, message);
  }, [showToast]);

  const dismissNotification = useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  const dismissAll = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);

  return {
    // Data
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
    isOpen: notificationsPanelOpen,

    // Actions
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissNotification,
    dismissAll,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    togglePanel: toggleNotificationsPanel
  };
}

/**
 * Hook for browser notifications
 */
export function useBrowserNotifications() {
  const { preferences } = useUIStore();

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const sendBrowserNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ) => {
    if (!preferences.pushNotifications) return;

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const notification = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Failed to send browser notification:', error);
    }
  }, [preferences.pushNotifications, requestPermission]);

  return {
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
    requestPermission,
    sendNotification: sendBrowserNotification
  };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
  const { preferences, updatePreferences } = useUIStore();

  const toggleEmailNotifications = useCallback(() => {
    updatePreferences({
      emailNotifications: !preferences.emailNotifications
    });
  }, [preferences.emailNotifications, updatePreferences]);

  const togglePushNotifications = useCallback(() => {
    updatePreferences({
      pushNotifications: !preferences.pushNotifications
    });
  }, [preferences.pushNotifications, updatePreferences]);

  const toggleSound = useCallback(() => {
    updatePreferences({
      soundEnabled: !preferences.soundEnabled
    });
  }, [preferences.soundEnabled, updatePreferences]);

  return {
    emailEnabled: preferences.emailNotifications,
    pushEnabled: preferences.pushNotifications,
    soundEnabled: preferences.soundEnabled,
    toggleEmail: toggleEmailNotifications,
    togglePush: togglePushNotifications,
    toggleSound
  };
}

/**
 * Hook for notification sound
 */
export function useNotificationSound() {
  const { preferences } = useUIStore();

  const playSound = useCallback((type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (!preferences.soundEnabled) return;

    // Map notification types to sound files
    const soundMap = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      warning: '/sounds/warning.mp3',
      info: '/sounds/info.mp3'
    };

    try {
      const audio = new Audio(soundMap[type]);
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.warn('Could not play notification sound:', err);
      });
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [preferences.soundEnabled]);

  return { playSound };
}