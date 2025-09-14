import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import {
  NotificationType,
  NotificationPriority,
  AppNotification,
  CreateNotificationInput
} from '../../types/notification.types';
import { useUIStore } from '../../stores/useUIStore';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationContextValue {
  // Core notification methods
  showSuccess: (title: string, message?: string, options?: NotificationOptions) => string;
  showError: (title: string, message?: string, options?: NotificationOptions) => string;
  showWarning: (title: string, message?: string, options?: NotificationOptions) => string;
  showInfo: (title: string, message?: string, options?: NotificationOptions) => string;

  // Advanced notification methods
  showNotification: (notification: CreateNotificationInput) => string;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;

  // Browser notifications
  requestBrowserPermission: () => Promise<boolean>;
  showBrowserNotification: (title: string, body?: string, options?: NotificationOptions) => Promise<void>;

  // Sound control
  playNotificationSound: (type: NotificationType) => void;

  // Notification history
  getNotificationHistory: () => AppNotification[];
  clearHistory: () => void;

  // Preferences
  isEnabled: (type: NotificationType) => boolean;
  isSoundEnabled: () => boolean;
  areBrowserNotificationsEnabled: () => boolean;
}

interface NotificationOptions {
  priority?: NotificationPriority;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  sound?: boolean;
  browserNotification?: boolean;
  icon?: React.ReactNode;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  maxNotifications?: number;
  soundEnabled?: boolean;
  browserNotificationsEnabled?: boolean;
}

// Sound URLs for different notification types
const NOTIFICATION_SOUNDS = {
  [NotificationType.SUCCESS]: '/sounds/success.mp3',
  [NotificationType.ERROR]: '/sounds/error.mp3',
  [NotificationType.WARNING]: '/sounds/warning.mp3',
  [NotificationType.INFO]: '/sounds/info.mp3'
};

// Icons for different notification types
const NOTIFICATION_ICONS = {
  [NotificationType.SUCCESS]: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  [NotificationType.ERROR]: <AlertCircle className="h-5 w-5 text-red-500" />,
  [NotificationType.WARNING]: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  [NotificationType.INFO]: <Info className="h-5 w-5 text-blue-500" />
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  position = 'top-right',
  maxNotifications = 5,
  soundEnabled: defaultSoundEnabled = true,
  browserNotificationsEnabled: defaultBrowserEnabled = false
}) => {
  const { preferences, addNotification } = useUIStore();
  const [notificationHistory, setNotificationHistory] = useState<AppNotification[]>([]);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffers, setAudioBuffers] = useState<Record<string, AudioBuffer>>({});

  // Initialize audio context and load sounds
  useEffect(() => {
    const initAudio = async () => {
      try {
        const context = new AudioContext();
        setAudioContext(context);

        // Load audio buffers
        const buffers: Record<string, AudioBuffer> = {};
        for (const [type, url] of Object.entries(NOTIFICATION_SOUNDS)) {
          try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await context.decodeAudioData(arrayBuffer);
            buffers[type] = audioBuffer;
          } catch (error) {
            console.warn(`Failed to load notification sound: ${url}`, error);
          }
        }
        setAudioBuffers(buffers);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    if (preferences.soundEnabled ?? defaultSoundEnabled) {
      initAudio();
    }

    return () => {
      audioContext?.close();
    };
  }, [preferences.soundEnabled, defaultSoundEnabled]);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback((type: NotificationType) => {
    if (!preferences.soundEnabled || !audioContext || !audioBuffers[type]) return;

    try {
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = audioBuffers[type];
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set volume
      gainNode.gain.value = 0.5;

      source.start(0);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [audioContext, audioBuffers, preferences.soundEnabled]);

  // Request browser notification permission
  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Browser notifications are not supported');
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

  // Show browser notification
  const showBrowserNotification = useCallback(async (
    title: string,
    body?: string,
    options?: NotificationOptions
  ) => {
    if (!(preferences.pushNotifications ?? defaultBrowserEnabled)) return;

    const hasPermission = await requestBrowserPermission();
    if (!hasPermission) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: uuidv4(),
        requireInteraction: options?.persistent,
        silent: !preferences.soundEnabled
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        options?.action?.onClick?.();
      };

      if (!options?.persistent) {
        setTimeout(() => {
          notification.close();
        }, options?.duration || 5000);
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [preferences.pushNotifications, preferences.soundEnabled, defaultBrowserEnabled, requestBrowserPermission]);

  // Core notification display function
  const showNotification = useCallback((input: CreateNotificationInput): string => {
    const id = uuidv4();
    const notification: AppNotification = {
      ...input,
      id,
      timestamp: new Date(),
      read: false,
      dismissed: false
    };

    // Store in history
    setNotificationHistory(prev => {
      const updated = [notification, ...prev].slice(0, 100); // Keep last 100
      localStorage.setItem('notification-history', JSON.stringify(updated));
      return updated;
    });

    // Store in global state
    addNotification({
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actions?.[0]?.url,
      actionLabel: notification.actions?.[0]?.label
    });

    // Play sound if enabled
    if (notification.autoClose !== false) {
      playNotificationSound(notification.type);
    }

    // Show browser notification for high priority
    if (notification.priority === NotificationPriority.HIGH ||
        notification.priority === NotificationPriority.URGENT) {
      showBrowserNotification(notification.title, notification.message);
    }

    // Show toast using Sonner
    const toastOptions = {
      id,
      duration: notification.autoCloseDelay || 5000,
      icon: NOTIFICATION_ICONS[notification.type],
      action: notification.actions?.[0] ? {
        label: notification.actions[0].label,
        onClick: () => {
          if (notification.actions?.[0]?.url) {
            window.open(notification.actions[0].url, '_blank');
          }
        }
      } : undefined
    };

    switch (notification.type) {
      case NotificationType.SUCCESS:
        toast.success(notification.title, {
          ...toastOptions,
          description: notification.message
        });
        break;
      case NotificationType.ERROR:
        toast.error(notification.title, {
          ...toastOptions,
          description: notification.message
        });
        break;
      case NotificationType.WARNING:
        toast.warning(notification.title, {
          ...toastOptions,
          description: notification.message
        });
        break;
      case NotificationType.INFO:
      default:
        toast(notification.title, {
          ...toastOptions,
          description: notification.message
        });
        break;
    }

    return id;
  }, [addNotification, playNotificationSound, showBrowserNotification]);

  // Helper methods
  const showSuccess = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return showNotification({
      type: NotificationType.SUCCESS,
      title,
      message: message || '',
      priority: options?.priority || NotificationPriority.LOW,
      ...options
    });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return showNotification({
      type: NotificationType.ERROR,
      title,
      message: message || '',
      priority: options?.priority || NotificationPriority.HIGH,
      ...options
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return showNotification({
      type: NotificationType.WARNING,
      title,
      message: message || '',
      priority: options?.priority || NotificationPriority.MEDIUM,
      ...options
    });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return showNotification({
      type: NotificationType.INFO,
      title,
      message: message || '',
      priority: options?.priority || NotificationPriority.LOW,
      ...options
    });
  }, [showNotification]);

  const dismissNotification = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  const getNotificationHistory = useCallback(() => {
    return notificationHistory;
  }, [notificationHistory]);

  const clearHistory = useCallback(() => {
    setNotificationHistory([]);
    localStorage.removeItem('notification-history');
  }, []);

  const isEnabled = useCallback((type: NotificationType) => {
    return true; // Can be extended to check per-type preferences
  }, []);

  const isSoundEnabled = useCallback(() => {
    return preferences.soundEnabled ?? defaultSoundEnabled;
  }, [preferences.soundEnabled, defaultSoundEnabled]);

  const areBrowserNotificationsEnabled = useCallback(() => {
    return preferences.pushNotifications ?? defaultBrowserEnabled;
  }, [preferences.pushNotifications, defaultBrowserEnabled]);

  // Load notification history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notification-history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotificationHistory(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load notification history:', error);
      }
    }
  }, []);

  const value: NotificationContextValue = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    dismissNotification,
    dismissAll,
    requestBrowserPermission,
    showBrowserNotification,
    playNotificationSound,
    getNotificationHistory,
    clearHistory,
    isEnabled,
    isSoundEnabled,
    areBrowserNotificationsEnabled
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster
        position={position}
        toastOptions={{
          unstyled: false,
          classNames: {
            toast: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            title: 'text-gray-900 dark:text-gray-100',
            description: 'text-gray-600 dark:text-gray-400',
            actionButton: 'bg-blue-500 text-white hover:bg-blue-600',
            cancelButton: 'bg-gray-200 dark:bg-gray-700',
            closeButton: 'bg-gray-100 dark:bg-gray-800'
          }
        }}
        expand={false}
        richColors
        closeButton
        visibleToasts={maxNotifications}
      />
    </NotificationContext.Provider>
  );
};

// Usage example in comments:
/*
// In your App.tsx:
import { NotificationProvider } from './components/notifications/NotificationProvider';

function App() {
  return (
    <NotificationProvider position="top-right" soundEnabled={true}>
      <YourAppContent />
    </NotificationProvider>
  );
}

// In your components:
import { useNotificationContext } from './components/notifications/NotificationProvider';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotificationContext();

  const handleAction = async () => {
    try {
      await doSomething();
      showSuccess('Success!', 'Operation completed successfully');
    } catch (error) {
      showError('Error!', 'Something went wrong', {
        priority: NotificationPriority.HIGH,
        action: {
          label: 'Retry',
          onClick: handleAction
        }
      });
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
*/