import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import {
  Command,
  CommandCategory,
  CommandActionType,
  KeyboardShortcut,
  ModifierKey
} from '../types/command.types';
import { usePortalStore } from './usePortalStore';
import { useIncidentStore } from './useIncidentStore';
import { useUIStore } from './useUIStore';
import { useStatsStore } from './useStatsStore';
import { PortalCategory } from '../types/portal.types';
import { TimeRange } from '../types/stats.types';

/**
 * Generate default commands
 */
const generateDefaultCommands = (): Command[] => [
  // Navigation commands
  {
    id: uuidv4(),
    name: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    category: CommandCategory.NAVIGATION,
    action: {
      type: CommandActionType.NAVIGATE,
      url: '/dashboard',
      target: '_self'
    } as any,
    icon: 'LayoutDashboard',
    shortcut: {
      key: 'd',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+D'
    },
    searchTerms: ['dashboard', 'home', 'main'],
    enabled: true,
    favorite: true,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false,
    usage: 0
  },
  {
    id: uuidv4(),
    name: 'Go to Portals',
    description: 'View all portals',
    category: CommandCategory.NAVIGATION,
    action: {
      type: CommandActionType.EXECUTE,
      handler: 'navigateToPortals',
      params: {}
    } as any,
    icon: 'Grid',
    shortcut: {
      key: 'p',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+P'
    },
    searchTerms: ['portals', 'services', 'applications'],
    enabled: true,
    favorite: false,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false,
    usage: 0
  },
  {
    id: uuidv4(),
    name: 'View Incidents',
    description: 'Open incidents panel',
    category: CommandCategory.NAVIGATION,
    action: {
      type: CommandActionType.OPEN_MODAL,
      modal: 'viewIncidents'
    } as any,
    icon: 'AlertTriangle',
    shortcut: {
      key: 'i',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+I'
    },
    searchTerms: ['incidents', 'alerts', 'issues'],
    enabled: true,
    favorite: false,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false,
    usage: 0
  },

  // Portal actions
  {
    id: uuidv4(),
    name: 'Add New Portal',
    description: 'Create a new portal entry',
    category: CommandCategory.PORTAL,
    action: {
      type: CommandActionType.OPEN_MODAL,
      modal: 'addPortal'
    } as any,
    icon: 'Plus',
    shortcut: {
      key: 'n',
      modifiers: [ModifierKey.CTRL, ModifierKey.SHIFT],
      description: 'Ctrl+Shift+N'
    },
    searchTerms: ['add', 'new', 'create', 'portal'],
    enabled: true,
    favorite: false,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false,
    usage: 0
  },
  {
    id: uuidv4(),
    name: 'Refresh All Portals',
    description: 'Update metrics for all portals',
    category: CommandCategory.PORTAL,
    action: {
      type: CommandActionType.REFRESH,
      target: 'portals'
    } as any,
    icon: 'RefreshCw',
    shortcut: {
      key: 'r',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+R'
    },
    searchTerms: ['refresh', 'update', 'sync'],
    isEnabled: true,
    isPinned: false
  },

  // System actions
  {
    id: uuidv4(),
    name: 'Run Health Check',
    description: 'Perform system-wide health check',
    category: CommandCategory.SYSTEM,
    actionType: CommandActionType.EXECUTE,
    action: async () => {
      useUIStore.getState().setGlobalLoading(true, 'Running health checks...');
      await useStatsStore.getState().runAllHealthChecks();
      useUIStore.getState().setGlobalLoading(false);
      useUIStore.getState().showToast('success', 'Health Check Complete', 'All systems checked');
    },
    icon: 'Activity',
    searchTerms: ['health', 'check', 'status', 'diagnostic'],
    isEnabled: true,
    isPinned: false,
    requiresConfirmation: false
  },
  {
    id: uuidv4(),
    name: 'Emergency Shutdown',
    description: 'Initiate emergency shutdown of non-critical services',
    category: CommandCategory.SYSTEM,
    actionType: CommandActionType.EXECUTE,
    action: () => {
      useUIStore.getState().showToast('warning', 'Emergency Shutdown', 'Initiating shutdown sequence...');
      // In real app, would trigger actual shutdown
    },
    icon: 'Power',
    searchTerms: ['emergency', 'shutdown', 'stop', 'critical'],
    isEnabled: true,
    isPinned: false,
    requiresConfirmation: true
  },

  // View actions
  {
    id: uuidv4(),
    name: 'Toggle Theme',
    description: 'Switch between light and dark theme',
    category: CommandCategory.VIEW,
    actionType: CommandActionType.TOGGLE,
    action: () => {
      const currentTheme = useUIStore.getState().theme;
      const newTheme = currentTheme === 'dark' ? 'light' : currentTheme === 'light' ? 'auto' : 'dark';
      useUIStore.getState().setTheme(newTheme);
    },
    icon: 'Moon',
    shortcut: {
      key: 't',
      modifiers: [ModifierKey.CTRL, ModifierKey.SHIFT],
      description: 'Ctrl+Shift+T'
    },
    searchTerms: ['theme', 'dark', 'light', 'appearance'],
    isEnabled: true,
    isPinned: false
  },
  {
    id: uuidv4(),
    name: 'Toggle Sidebar',
    description: 'Show or hide the sidebar',
    category: CommandCategory.VIEW,
    actionType: CommandActionType.TOGGLE,
    action: () => {
      useUIStore.getState().toggleSidebar();
    },
    icon: 'Sidebar',
    shortcut: {
      key: 's',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+S'
    },
    searchTerms: ['sidebar', 'toggle', 'hide', 'show'],
    isEnabled: true,
    isPinned: false
  },
  {
    id: uuidv4(),
    name: 'Switch to Grid View',
    description: 'Display portals in grid layout',
    category: CommandCategory.VIEW,
    actionType: CommandActionType.SWITCH,
    action: () => {
      useUIStore.getState().setView('grid');
    },
    icon: 'Grid',
    searchTerms: ['grid', 'view', 'layout', 'cards'],
    isEnabled: true,
    isPinned: false
  },
  {
    id: uuidv4(),
    name: 'Switch to List View',
    description: 'Display portals in list layout',
    category: CommandCategory.VIEW,
    actionType: CommandActionType.SWITCH,
    action: () => {
      useUIStore.getState().setView('list');
    },
    icon: 'List',
    searchTerms: ['list', 'view', 'layout', 'table'],
    isEnabled: true,
    isPinned: false
  },

  // Filter actions
  {
    id: uuidv4(),
    name: 'Show All Portals',
    description: 'Remove all filters',
    category: CommandCategory.FILTER,
    actionType: CommandActionType.FILTER,
    action: () => {
      usePortalStore.getState().clearFilter();
      useUIStore.getState().setCategory(PortalCategory.ALL);
    },
    icon: 'Filter',
    searchTerms: ['all', 'clear', 'filter', 'reset'],
    isEnabled: true,
    isPinned: false
  },
  {
    id: uuidv4(),
    name: 'Show Favorites',
    description: 'Display only favorite portals',
    category: CommandCategory.FILTER,
    actionType: CommandActionType.FILTER,
    action: () => {
      usePortalStore.getState().setFilter({ isFavorite: true });
    },
    icon: 'Star',
    searchTerms: ['favorites', 'starred', 'bookmarks'],
    isEnabled: true,
    isPinned: false
  },

  // Settings actions
  {
    id: uuidv4(),
    name: 'Open Settings',
    description: 'Access application settings',
    category: CommandCategory.SETTINGS,
    actionType: CommandActionType.OPEN_MODAL,
    action: () => {
      useUIStore.getState().openModal('settings');
    },
    icon: 'Settings',
    shortcut: {
      key: ',',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+,'
    },
    searchTerms: ['settings', 'preferences', 'config', 'options'],
    isEnabled: true,
    isPinned: false
  },

  // Help actions
  {
    id: uuidv4(),
    name: 'Show Keyboard Shortcuts',
    description: 'Display all keyboard shortcuts',
    category: CommandCategory.HELP,
    actionType: CommandActionType.OPEN_MODAL,
    action: () => {
      useUIStore.getState().openModal('help');
    },
    icon: 'Keyboard',
    shortcut: {
      key: '?',
      modifiers: [ModifierKey.SHIFT],
      description: 'Shift+?'
    },
    searchTerms: ['shortcuts', 'keyboard', 'hotkeys', 'keys'],
    isEnabled: true,
    isPinned: false
  },
  {
    id: uuidv4(),
    name: 'Start Tour',
    description: 'Begin interactive tutorial',
    category: CommandCategory.HELP,
    actionType: CommandActionType.EXECUTE,
    action: () => {
      useUIStore.getState().startTour();
    },
    icon: 'HelpCircle',
    searchTerms: ['tour', 'tutorial', 'guide', 'help'],
    isEnabled: true,
    isPinned: false
  }
];

/**
 * Generate category-specific filter commands
 */
const generateCategoryCommands = (): Command[] => {
  const categories = Object.values(PortalCategory).filter(c => c !== PortalCategory.ALL);

  return categories.map(category => ({
    id: uuidv4(),
    name: `Filter: ${category}`,
    description: `Show only ${category.toLowerCase()} portals`,
    category: CommandCategory.FILTER,
    actionType: CommandActionType.FILTER,
    action: () => {
      useUIStore.getState().setCategory(category);
    },
    icon: 'Filter',
    searchTerms: [category.toLowerCase(), 'filter', 'category'],
    isEnabled: true,
    isPinned: false
  }));
};

/**
 * Generate time range commands
 */
const generateTimeRangeCommands = (): Command[] => {
  const timeRanges = [
    { range: TimeRange.ONE_HOUR, label: 'Last Hour' },
    { range: TimeRange.TWENTY_FOUR_HOURS, label: 'Last 24 Hours' },
    { range: TimeRange.SEVEN_DAYS, label: 'Last 7 Days' },
    { range: TimeRange.THIRTY_DAYS, label: 'Last 30 Days' }
  ];

  return timeRanges.map(({ range, label }) => ({
    id: uuidv4(),
    name: `Time Range: ${label}`,
    description: `Set metrics time range to ${label}`,
    category: CommandCategory.FILTER,
    actionType: CommandActionType.SWITCH,
    action: () => {
      useUIStore.getState().setTimeRange(range);
    },
    icon: 'Clock',
    searchTerms: ['time', 'range', 'period', label.toLowerCase()],
    isEnabled: true,
    isPinned: false
  }));
};

interface CommandState {
  // Commands
  commands: Command[];
  recentCommands: string[]; // Command IDs
  commandHistory: Array<{ commandId: string; timestamp: Date }>;

  // Search
  searchQuery: string;
  searchResults: Command[];

  // Shortcuts
  shortcuts: Map<string, string>; // shortcut key -> command ID

  // State
  isOpen: boolean;
  selectedIndex: number;

  // Actions
  registerCommand: (command: Command) => void;
  unregisterCommand: (id: string) => void;
  executeCommand: (id: string) => void;
  searchCommands: (query: string) => void;

  // Shortcut actions
  registerShortcut: (shortcut: KeyboardShortcut, commandId: string) => void;
  unregisterShortcut: (shortcut: KeyboardShortcut) => void;
  handleKeyboardShortcut: (event: KeyboardEvent) => boolean;

  // UI actions
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  selectNext: () => void;
  selectPrevious: () => void;
  executeSelected: () => void;

  // History actions
  addToHistory: (commandId: string) => void;
  clearHistory: () => void;

  // Pin actions
  pinCommand: (id: string) => void;
  unpinCommand: (id: string) => void;

  // Initialize
  initialize: () => void;
}

export const useCommandStore = create<CommandState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      commands: [],
      recentCommands: [],
      commandHistory: [],
      searchQuery: '',
      searchResults: [],
      shortcuts: new Map(),
      isOpen: false,
      selectedIndex: 0,

      // Actions
      registerCommand: (command) => set(state => {
        const existingIndex = state.commands.findIndex(c => c.id === command.id);
        if (existingIndex !== -1) {
          state.commands[existingIndex] = command;
        } else {
          state.commands.push(command);
        }

        // Register shortcut if provided
        if (command.shortcut) {
          get().registerShortcut(command.shortcut, command.id);
        }
      }),

      unregisterCommand: (id) => set(state => {
        const command = state.commands.find(c => c.id === id);
        if (command?.shortcut) {
          get().unregisterShortcut(command.shortcut);
        }
        state.commands = state.commands.filter(c => c.id !== id);
      }),

      executeCommand: (id) => {
        const command = get().commands.find(c => c.id === id);
        if (!command || !command.isEnabled) return;

        // Add to history
        get().addToHistory(id);

        // Close command palette if it's a navigation command
        if (command.actionType === CommandActionType.NAVIGATE) {
          get().closeCommandPalette();
        }

        // Execute the command action
        if (command.requiresConfirmation) {
          // In real app, would show confirmation dialog
          const confirmed = window.confirm(`Are you sure you want to ${command.name}?`);
          if (confirmed) {
            command.action();
          }
        } else {
          command.action();
        }
      },

      searchCommands: (query) => {
        set(state => {
          state.searchQuery = query;
          state.selectedIndex = 0;
        });

        if (!query) {
          set(state => {
            // Show pinned and recent commands when no query
            const pinnedCommands = state.commands.filter(c => c.isPinned && c.isEnabled);
            const recentCommandObjects = state.recentCommands
              .map(id => state.commands.find(c => c.id === id))
              .filter(Boolean) as Command[];

            state.searchResults = [...pinnedCommands, ...recentCommandObjects];
          });
          return;
        }

        const lowerQuery = query.toLowerCase();
        const results = [...get().commands].filter(command => {
          if (!command.isEnabled) return false;

          // Check name and description
          if (command.name.toLowerCase().includes(lowerQuery) ||
              command.description.toLowerCase().includes(lowerQuery)) {
            return true;
          }

          // Check search terms
          if (command.searchTerms?.some(term => term.toLowerCase().includes(lowerQuery))) {
            return true;
          }

          // Check category
          if (command.category.toLowerCase().includes(lowerQuery)) {
            return true;
          }

          return false;
        });

        // Sort by relevance (exact matches first, then pinned, then others)
        results.sort((a, b) => {
          const aExact = a.name.toLowerCase() === lowerQuery;
          const bExact = b.name.toLowerCase() === lowerQuery;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;

          return 0;
        });

        set(state => {
          state.searchResults = results;
        });
      },

      registerShortcut: (shortcut, commandId) => {
        const key = formatShortcutKey(shortcut);
        set(state => {
          state.shortcuts.set(key, commandId);
        });
      },

      unregisterShortcut: (shortcut) => {
        const key = formatShortcutKey(shortcut);
        set(state => {
          state.shortcuts.delete(key);
        });
      },

      handleKeyboardShortcut: (event) => {
        const { shortcuts, commands } = get();

        // Build shortcut key from event
        const modifiers: ModifierKey[] = [];
        if (event.ctrlKey || event.metaKey) modifiers.push(ModifierKey.CTRL);
        if (event.altKey) modifiers.push(ModifierKey.ALT);
        if (event.shiftKey) modifiers.push(ModifierKey.SHIFT);

        const shortcut: KeyboardShortcut = {
          key: event.key.toLowerCase(),
          modifiers,
          description: ''
        };

        const key = formatShortcutKey(shortcut);
        const commandId = shortcuts.get(key);

        if (commandId) {
          event.preventDefault();
          get().executeCommand(commandId);
          return true;
        }

        // Special case for command palette
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
          event.preventDefault();
          get().toggleCommandPalette();
          return true;
        }

        return false;
      },

      openCommandPalette: () => {
        set(state => {
          state.isOpen = true;
          state.searchQuery = '';
          state.selectedIndex = 0;
        });
        get().searchCommands('');
      },

      closeCommandPalette: () => set(state => {
        state.isOpen = false;
        state.searchQuery = '';
        state.selectedIndex = 0;
        state.searchResults = [];
      }),

      toggleCommandPalette: () => {
        if (get().isOpen) {
          get().closeCommandPalette();
        } else {
          get().openCommandPalette();
        }
      },

      selectNext: () => set(state => {
        if (state.searchResults.length > 0) {
          state.selectedIndex = (state.selectedIndex + 1) % state.searchResults.length;
        }
      }),

      selectPrevious: () => set(state => {
        if (state.searchResults.length > 0) {
          state.selectedIndex = state.selectedIndex === 0
            ? state.searchResults.length - 1
            : state.selectedIndex - 1;
        }
      }),

      executeSelected: () => {
        const { searchResults, selectedIndex } = get();
        if (searchResults[selectedIndex]) {
          get().executeCommand(searchResults[selectedIndex].id);
        }
      },

      addToHistory: (commandId) => set(state => {
        state.commandHistory.unshift({ commandId, timestamp: new Date() });

        // Keep only last 50 history items
        if (state.commandHistory.length > 50) {
          state.commandHistory = state.commandHistory.slice(0, 50);
        }

        // Update recent commands (unique, max 5)
        state.recentCommands = state.recentCommands.filter(id => id !== commandId);
        state.recentCommands.unshift(commandId);
        if (state.recentCommands.length > 5) {
          state.recentCommands = state.recentCommands.slice(0, 5);
        }
      }),

      clearHistory: () => set(state => {
        state.commandHistory = [];
        state.recentCommands = [];
      }),

      pinCommand: (id) => set(state => {
        const command = state.commands.find(c => c.id === id);
        if (command) {
          command.isPinned = true;
        }
      }),

      unpinCommand: (id) => set(state => {
        const command = state.commands.find(c => c.id === id);
        if (command) {
          command.isPinned = false;
        }
      }),

      initialize: () => {
        // Register default commands
        const defaultCommands = [
          ...generateDefaultCommands(),
          ...generateCategoryCommands(),
          ...generateTimeRangeCommands()
        ];

        set(state => {
          state.commands = defaultCommands;
        });

        // Register shortcuts
        defaultCommands.forEach(command => {
          if (command.shortcut) {
            get().registerShortcut(command.shortcut, command.id);
          }
        });

        // Set up global keyboard listener
        document.addEventListener('keydown', (event) => {
          // Ignore if typing in an input field
          if (event.target instanceof HTMLInputElement ||
              event.target instanceof HTMLTextAreaElement) {
            return;
          }

          get().handleKeyboardShortcut(event);
        });
      }
    }))
  )
);

// Helper function to format shortcut key for storage
function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const modifiers = shortcut.modifiers || [];
  const parts = [...modifiers].sort().concat(shortcut.key.toLowerCase());
  return parts.join('+');
}