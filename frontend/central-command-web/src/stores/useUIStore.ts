import { create } from 'zustand';
import { AppNotification } from "../types/notification.types";
type Notification = AppNotification;
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { TimeRange } from '../types/stats.types';
import { PortalCategory } from '../types/portal.types';
import { NotificationType, NotificationPriority } from '../types/notification.types';

export type ViewMode = 'grid' | 'list' | 'dashboard';
export type Theme = 'light' | 'dark' | 'auto';

interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  duration?: number; // milliseconds, for toast notifications
}

interface UIState {
  // View state
  currentView: ViewMode;
  activeCategory: PortalCategory;
  searchTerm: string;
  commandPaletteOpen: boolean;
  selectedTimeRange: TimeRange;

  // Theme
  theme: Theme;
  systemTheme: 'light' | 'dark';

  // Layout
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  headerHeight: number;

  // Modals
  modals: {
    addPortal: boolean;
    viewIncidents: boolean;
    settings: boolean;
    profile: boolean;
    help: boolean;
    export: boolean;
    import: boolean;
    bulkEdit: boolean;
  };

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  notificationsPanelOpen: boolean;

  // Loading states
  globalLoading: boolean;
  loadingMessage?: string;

  // Error states
  globalError: string | null;

  // User preferences (persisted)
  preferences: {
    compactMode: boolean;
    showTutorials: boolean;
    autoRefresh: boolean;
    refreshInterval: number; // seconds
    soundEnabled: boolean;
    keyboardShortcutsEnabled: boolean;
    animations: boolean;
    defaultView: ViewMode;
    defaultCategory: PortalCategory;
    defaultTimeRange: TimeRange;
  };

  // Tour/Onboarding
  tourActive: boolean;
  tourStep: number;
  tourCompleted: boolean;

  // Actions
  setView: (view: ViewMode) => void;
  setCategory: (category: PortalCategory) => void;
  setSearchTerm: (term: string) => void;
  toggleCommandPalette: () => void;
  setTimeRange: (range: TimeRange) => void;

  // Theme actions
  setTheme: (theme: Theme) => void;
  detectSystemTheme: () => void;
  applyTheme: () => void;

  // Layout actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setHeaderHeight: (height: number) => void;

  // Modal actions
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  toggleNotificationsPanel: () => void;
  showToast: (type: NotificationType, title: string, message: string, duration?: number) => void;

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setGlobalError: (error: string | null) => void;

  // Preference actions
  updatePreferences: (preferences: Partial<UIState['preferences']>) => void;
  resetPreferences: () => void;

  // Tour actions
  startTour: () => void;
  nextTourStep: () => void;
  previousTourStep: () => void;
  skipTour: () => void;
  completeTour: () => void;

  // Initialization
  initialize: () => void;
}

const defaultPreferences: UIState['preferences'] = {
  compactMode: false,
  showTutorials: true,
  autoRefresh: true,
  refreshInterval: 30,
  soundEnabled: true,
  keyboardShortcutsEnabled: true,
  animations: true,
  defaultView: 'dashboard',
  defaultCategory: PortalCategory.All,
  defaultTimeRange: TimeRange.TWENTY_FOUR_HOURS
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        currentView: 'dashboard',
        activeCategory: PortalCategory.ALL,
        searchTerm: '',
        commandPaletteOpen: false,
        selectedTimeRange: TimeRange.TWENTY_FOUR_HOURS,

        theme: 'auto',
        systemTheme: 'light',

        sidebarCollapsed: false,
        sidebarWidth: 280,
        headerHeight: 64,

        modals: {
          addPortal: false,
          viewIncidents: false,
          settings: false,
          profile: false,
          help: false,
          export: false,
          import: false,
          bulkEdit: false
        },

        notifications: [],
        unreadCount: 0,
        notificationsPanelOpen: false,

        globalLoading: false,
        loadingMessage: undefined,
        globalError: null,

        preferences: defaultPreferences,

        tourActive: false,
        tourStep: 0,
        tourCompleted: false,

        // Actions
        setView: (view) => set(state => {
          state.currentView = view;
        }),

        setCategory: (category) => set(state => {
          state.activeCategory = category;
        }),

        setSearchTerm: (term) => set(state => {
          state.searchTerm = term;
        }),

        toggleCommandPalette: () => set(state => {
          state.commandPaletteOpen = !state.commandPaletteOpen;
        }),

        setTimeRange: (range) => set(state => {
          state.selectedTimeRange = range;
        }),

        setTheme: (theme) => {
          set(state => {
            state.theme = theme;
          });
          get().applyTheme();
        },

        detectSystemTheme: () => {
          const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          set(state => {
            state.systemTheme = isDark ? 'dark' : 'light';
          });
        },

        applyTheme: () => {
          const { theme, systemTheme } = get();
          const effectiveTheme = theme === 'auto' ? systemTheme : theme;

          if (effectiveTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        },

        toggleSidebar: () => set(state => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }),

        setSidebarWidth: (width) => set(state => {
          state.sidebarWidth = width;
        }),

        setHeaderHeight: (height) => set(state => {
          state.headerHeight = height;
        }),

        openModal: (modal) => set(state => {
          state.modals[modal] = true;
        }),

        closeModal: (modal) => set(state => {
          state.modals[modal] = false;
        }),

        closeAllModals: () => set(state => {
          Object.keys(state.modals).forEach(key => {
            state.modals[key as keyof typeof state.modals] = false;
          });
        }),

        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: uuidv4(),
            timestamp: new Date(),
            read: false
          };

          set(state => {
            state.notifications.unshift(newNotification);
            state.unreadCount++;

            // Limit notifications to 100
            if (state.notifications.length > 100) {
              state.notifications = state.notifications.slice(0, 100);
            }
          });

          // Auto-remove toast notifications after duration
          if (notification.duration) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, notification.duration);
          }

          // Play sound if enabled
          if (get().preferences.soundEnabled && notification.priority === NotificationPriority.HIGH) {
            // Play notification sound (would need actual audio file)
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {
              // Ignore audio play errors
            });
          }

          return newNotification;
        },

        removeNotification: (id) => set(state => {
          const notification = state.notifications.find((n: Notification) => n.id === id);
          if (notification && !notification.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications = state.notifications.filter((n: Notification) => n.id !== id);
        }),

        markNotificationAsRead: (id) => set(state => {
          const notification = state.notifications.find((n: Notification) => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }),

        markAllNotificationsAsRead: () => set(state => {
          state.notifications.forEach((n: Notification) => {
            n.read = true;
          });
          state.unreadCount = 0;
        }),

        clearNotifications: () => set(state => {
          state.notifications = [];
          state.unreadCount = 0;
        }),

        toggleNotificationsPanel: () => set(state => {
          state.notificationsPanelOpen = !state.notificationsPanelOpen;
          if (state.notificationsPanelOpen) {
            // Mark all as read when opening panel
            get().markAllNotificationsAsRead();
          }
        }),

        showToast: (type, title, message, duration = 5000) => {
          get().addNotification({
            type,
            priority: type === NotificationType.ERROR ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            title,
            message,
            duration
          });
        },

        setGlobalLoading: (loading, message) => set(state => {
          state.globalLoading = loading;
          state.loadingMessage = message;
        }),

        setGlobalError: (error) => set(state => {
          state.globalError = error;
          if (error) {
            get().showToast(NotificationType.ERROR, 'Error', error);
          }
        }),

        updatePreferences: (preferences) => set(state => {
          state.preferences = { ...state.preferences, ...preferences };
        }),

        resetPreferences: () => set(state => {
          state.preferences = defaultPreferences;
        }),

        startTour: () => set(state => {
          state.tourActive = true;
          state.tourStep = 0;
          state.tourCompleted = false;
        }),

        nextTourStep: () => set(state => {
          state.tourStep++;
        }),

        previousTourStep: () => set(state => {
          if (state.tourStep > 0) {
            state.tourStep--;
          }
        }),

        skipTour: () => set(state => {
          state.tourActive = false;
          state.tourStep = 0;
        }),

        completeTour: () => set(state => {
          state.tourActive = false;
          state.tourCompleted = true;
          state.tourStep = 0;
        }),

        initialize: () => {
          const { preferences } = get();

          // Apply saved preferences
          set(state => {
            state.currentView = preferences.defaultView;
            state.activeCategory = preferences.defaultCategory;
            state.selectedTimeRange = preferences.defaultTimeRange;
          });

          // Detect system theme
          get().detectSystemTheme();
          get().applyTheme();

          // Listen for system theme changes
          if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
              get().detectSystemTheme();
              if (get().theme === 'auto') {
                get().applyTheme();
              }
            });
          }

          // Set up auto-refresh if enabled
          if (preferences.autoRefresh) {
            setInterval(() => {
              // Trigger refresh events
              window.dispatchEvent(new CustomEvent('autoRefresh'));
            }, preferences.refreshInterval * 1000);
          }

          // Show welcome notification for first-time users
          if (!get().tourCompleted && preferences.showTutorials) {
            get().addNotification({
              type: NotificationType.INFO,
              priority: NotificationPriority.MEDIUM,
              title: 'Welcome to Central Command',
              message: 'Take a quick tour to learn about the features',
              actionLabel: 'Start Tour',
              actionUrl: '#tour'
            });
          }
        }
      })),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          preferences: state.preferences,
          tourCompleted: state.tourCompleted,
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarWidth: state.sidebarWidth
        })
      }
    )
  )
);

// Export types
export type { UIState, ViewMode, Theme };
