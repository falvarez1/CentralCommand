import { v4 as uuidv4 } from 'uuid';
import { NotificationType, NotificationPriority } from "@/types/notification.types";
import type { UIState } from "@/stores/useUIStore";
import {
  CommandCategory,
  CommandActionType,
  ModifierKey,
  Command
} from '@/types/command.types';
import { usePortalStore } from '@/stores/usePortalStore';
import { useIncidentStore } from '@/stores/useIncidentStore';
import { useUIStore } from '@/stores/useUIStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { PortalCategory } from '@/types/portal.types';
import { TimeRange } from '@/types/stats.types';

/**
 * Extended Command interface with action handler
 */
export interface ExtendedCommand extends Omit<Command, 'action'> {
  action: Command['action'];
  handler?: () => void | Promise<void>;
}

/**
 * Convert ExtendedCommand to Command
 */
export const toCommand = (extCommand: ExtendedCommand): Command => {
  const { handler, ...command } = extCommand;
  return command as Command;
};

/**
 * Execute a command based on its action type
 */
export const executeCommandAction = async (command: ExtendedCommand) => {
  // If there's a custom handler, use it
  if (command.handler) {
    await command.handler();
    return;
  }

  // Otherwise, execute based on action type
  const { action } = command;
  const uiStore = useUIStore.getState();
  const portalStore = usePortalStore.getState();
  const incidentStore = useIncidentStore.getState();
  const statsStore = useStatsStore.getState();

  switch (action.type) {
    case CommandActionType.NAVIGATE:
      if (action.target === '_blank') {
        window.open(action.url, '_blank');
      } else {
        window.location.href = action.url;
      }
      break;

    case CommandActionType.OPEN_MODAL:
      uiStore.openModal(action.modal as keyof UIState["modals"]);
      break;

    case CommandActionType.CLOSE_MODAL:
      if (action.modal) {
        uiStore.closeModal(action.modal as keyof UIState["modals"]);
      } else {
        uiStore.closeAllModals();
      }
      break;

    case CommandActionType.TOGGLE:
      if (action.setting === 'theme') {
        const currentTheme = uiStore.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        uiStore.setTheme(newTheme);
      } else if (action.setting === 'view') {
        const currentView = uiStore.currentView;
        const newView = currentView === 'grid' ? 'list' : 'grid';
        uiStore.setView(newView);
      } else if (action.setting === 'sidebar') {
        uiStore.toggleSidebar();
      }
      break;

    case CommandActionType.FILTER:
      Object.entries(action.filters).forEach(([key, value]) => {
        if (key === 'category') {
          uiStore.setCategory(value as PortalCategory);
        } else if (key === 'isFavorite') {
          portalStore.setFilter({ isFavorite: value as boolean });
        } else {
          portalStore.setFilter({ [key]: value });
        }
      });
      break;

    case CommandActionType.REFRESH:
      uiStore.setGlobalLoading(true, 'Refreshing data...');
      try {
        if (action.target === 'all' || !action.target) {
          await Promise.all([
            portalStore.updateAllMetrics(),
            // Incidents loaded via service layer,
            statsStore.updateSystemStats()
          ]);
        } else if (action.target === 'portals') {
          await portalStore.updateAllMetrics();
        } else if (action.target === 'incidents') {
          // Incidents are loaded via service layer
        } else if (action.target === 'stats') {
          await statsStore.updateSystemStats();
        }
        uiStore.showToast(NotificationType.SUCCESS, 'Data Refreshed', 'All data has been updated');
      } finally {
        uiStore.setGlobalLoading(false);
      }
      break;

    case CommandActionType.EXPORT:
      const data = action.data === 'portals' ? portalStore.portals :
                   action.data === 'incidents' ? incidentStore.incidents :
                   action.data === 'stats' ? statsStore.systemStats :
                   { portals: portalStore.portals, incidents: incidentStore.incidents };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${action.data || 'data'}-${Date.now()}.${action.format}`;
      a.click();
      URL.revokeObjectURL(url);
      uiStore.showToast(NotificationType.SUCCESS, 'Export Complete', `Data exported successfully`);
      break;

    case CommandActionType.SEARCH:
      uiStore.setSearchTerm(action.query);
      if (action.scope === 'portals') {
        portalStore.setSearchTerm(action.query);
      } else if (action.scope === 'incidents') {
        incidentStore.setFilter({ searchTerm: action.query });
      }
      // Focus search input
      setTimeout(() => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 100);
      break;

    case CommandActionType.SYSTEM:
      switch (action.command) {
        case 'deploy':
          if (window.confirm('Deploy all services?')) {
            uiStore.showToast(NotificationType.INFO, 'Deployment Started', 'Deploying all services...');
            // Implement actual deployment
          }
          break;
        case 'healthcheck':
          uiStore.setGlobalLoading(true, 'Running health checks...');
          await statsStore.runAllHealthChecks();
          uiStore.setGlobalLoading(false);
          uiStore.showToast(NotificationType.SUCCESS, 'Health Check Complete', 'All systems operational');
          break;
        case 'maintenance':
          // TODO: Add scheduleMaintenance modal
        uiStore.addNotification({
          type: NotificationType.INFO,
          title: 'Schedule Maintenance',
          message: 'Maintenance scheduling feature coming soon',
          priority: NotificationPriority.MEDIUM,
          channels: [],
          persistent: false,
          autoClose: true,
          autoCloseDelay: 5000,
          actions: [],
          dismissed: false,
          tags: [],
          broadcast: false
        });
          break;
        case 'shutdown':
          if (window.confirm('Emergency shutdown of non-critical services?')) {
            uiStore.showToast(NotificationType.WARNING, 'Emergency Shutdown', 'Shutting down non-critical services...');
            // Implement actual shutdown
          }
          break;
        case 'restart':
          if (window.confirm('Restart all services?')) {
            uiStore.showToast(NotificationType.INFO, 'Restart Initiated', 'Restarting all services...');
            // Implement actual restart
          }
          break;
      }
      break;

    case CommandActionType.CREATE:
      if (action.entity === 'portal') {
        uiStore.openModal('addPortal');
      } else if (action.entity === 'incident') {
        uiStore.openModal('viewIncidents');
      }
      break;

    case CommandActionType.DELETE:
      if (action.entity === 'portal') {
        if (window.confirm('Delete this portal?')) {
          portalStore.deletePortal(action.id);
        }
      } else if (action.entity === 'incident') {
        if (window.confirm('Delete this incident?')) {
          incidentStore.deleteIncident(action.id);
        }
      }
      break;

    case CommandActionType.UPDATE:
      if (action.entity === 'portal') {
        portalStore.updatePortal(action.id, action.data);
      } else if (action.entity === 'incident') {
        incidentStore.updateIncident(action.id, action.data);
      }
      break;

    case CommandActionType.EXECUTE:
      // Custom handler required for EXECUTE type
      console.warn('EXECUTE action requires a custom handler');
      break;
  }
};

/**
 * Get default commands
 */
export const getDefaultCommands = (): ExtendedCommand[] => [
  // Navigation Commands
  {
    id: uuidv4(),
    name: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    category: CommandCategory.NAVIGATION,
    action: {
      type: CommandActionType.NAVIGATE,
      url: '/dashboard',
      target: '_self'
    },
    icon: 'LayoutDashboard',
    shortcut: {
      key: 'd',
      modifiers: [ModifierKey.ALT],
      description: 'Alt+D'
    },
    searchTerms: ['dashboard', 'home', 'main', 'overview'],
    enabled: true,
    favorite: true,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'View All Portals',
    description: 'Navigate to portals page',
    category: CommandCategory.NAVIGATION,
    action: {
      type: CommandActionType.EXECUTE,
      handler: 'navigateToPortals',
      params: {}
    },
    handler: () => {
      useUIStore.getState().setView('grid');
    },
    icon: 'Grid3x3',
    shortcut: {
      key: 'p',
      modifiers: [ModifierKey.ALT],
      description: 'Alt+P'
    },
    searchTerms: ['portals', 'services', 'applications', 'all'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'View Incidents',
    description: 'Open incidents management panel',
    category: CommandCategory.NAVIGATION,
    action: {
      type: CommandActionType.OPEN_MODAL,
      modal: 'incidents'
    },
    icon: 'AlertTriangle',
    shortcut: {
      key: 'i',
      modifiers: [ModifierKey.ALT],
      description: 'Alt+I'
    },
    searchTerms: ['incidents', 'alerts', 'issues', 'problems'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'View Settings',
    description: 'Open application settings',
    category: CommandCategory.NAVIGATION,
    action: {
      type: CommandActionType.OPEN_MODAL,
      modal: 'settings'
    },
    icon: 'Settings',
    shortcut: {
      key: ',',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+,'
    },
    searchTerms: ['settings', 'preferences', 'configuration', 'options'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },

  // Portal Actions
  {
    id: uuidv4(),
    name: 'Add New Portal',
    description: 'Create a new portal entry',
    category: CommandCategory.PORTAL,
    action: {
      type: CommandActionType.CREATE,
      entity: 'portal'
    },
    icon: 'Plus',
    shortcut: {
      key: 'n',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+N'
    },
    searchTerms: ['add', 'new', 'create', 'portal', 'service'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: ['portal.create'],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Search Portals',
    description: 'Search through all portals',
    category: CommandCategory.PORTAL,
    action: {
      type: CommandActionType.SEARCH,
      query: '',
      scope: 'portals'
    },
    icon: 'Search',
    shortcut: {
      key: '/',
      modifiers: [],
      description: '/'
    },
    searchTerms: ['search', 'find', 'lookup', 'query'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'View Favorites',
    description: 'Show only favorite portals',
    category: CommandCategory.PORTAL,
    action: {
      type: CommandActionType.FILTER,
      filters: { isFavorite: true }
    },
    icon: 'Star',
    searchTerms: ['favorites', 'starred', 'bookmarks', 'saved'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Export Portal Data',
    description: 'Export all portal data to JSON',
    category: CommandCategory.PORTAL,
    action: {
      type: CommandActionType.EXPORT,
      format: 'json',
      data: 'portals'
    },
    icon: 'Download',
    shortcut: {
      key: 'e',
      modifiers: [ModifierKey.CTRL, ModifierKey.SHIFT],
      description: 'Ctrl+Shift+E'
    },
    searchTerms: ['export', 'download', 'save', 'backup'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: ['portal.export'],
    recent: false
  },

  // System Actions
  {
    id: uuidv4(),
    name: 'Deploy All Services',
    description: 'Deploy all portal services',
    category: CommandCategory.SYSTEM,
    action: {
      type: CommandActionType.SYSTEM,
      command: 'deploy'
    },
    icon: 'Rocket',
    searchTerms: ['deploy', 'release', 'publish', 'rollout'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: true,
    requiredPermissions: ['system.deploy'],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Run Health Check',
    description: 'Perform system health check',
    category: CommandCategory.SYSTEM,
    action: {
      type: CommandActionType.SYSTEM,
      command: 'healthcheck'
    },
    icon: 'Activity',
    shortcut: {
      key: 'h',
      modifiers: [ModifierKey.CTRL, ModifierKey.SHIFT],
      description: 'Ctrl+Shift+H'
    },
    searchTerms: ['health', 'check', 'status', 'diagnostic', 'test'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Schedule Maintenance',
    description: 'Schedule system maintenance window',
    category: CommandCategory.SYSTEM,
    action: {
      type: CommandActionType.SYSTEM,
      command: 'maintenance'
    },
    icon: 'Wrench',
    searchTerms: ['maintenance', 'schedule', 'downtime', 'window'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: true,
    requiredPermissions: ['system.maintenance'],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Emergency Shutdown',
    description: 'Emergency shutdown of non-critical services',
    category: CommandCategory.SYSTEM,
    action: {
      type: CommandActionType.SYSTEM,
      command: 'shutdown'
    },
    icon: 'Power',
    searchTerms: ['emergency', 'shutdown', 'stop', 'critical', 'kill'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: true,
    requiredPermissions: ['system.shutdown'],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Refresh Data',
    description: 'Refresh all portal and incident data',
    category: CommandCategory.SYSTEM,
    action: {
      type: CommandActionType.REFRESH,
      target: 'all'
    },
    icon: 'RefreshCw',
    shortcut: {
      key: 'r',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+R'
    },
    searchTerms: ['refresh', 'reload', 'update', 'sync'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },

  // View Controls
  {
    id: uuidv4(),
    name: 'Toggle Theme',
    description: 'Switch between light and dark theme',
    category: CommandCategory.VIEW,
    action: {
      type: CommandActionType.TOGGLE,
      setting: 'theme'
    },
    icon: 'Moon',
    shortcut: {
      key: 't',
      modifiers: [ModifierKey.CTRL, ModifierKey.SHIFT],
      description: 'Ctrl+Shift+T'
    },
    searchTerms: ['theme', 'dark', 'light', 'appearance', 'mode'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Toggle View',
    description: 'Switch between grid and list view',
    category: CommandCategory.VIEW,
    action: {
      type: CommandActionType.TOGGLE,
      setting: 'view'
    },
    icon: 'LayoutGrid',
    shortcut: {
      key: 'v',
      modifiers: [ModifierKey.ALT],
      description: 'Alt+V'
    },
    searchTerms: ['view', 'grid', 'list', 'layout', 'display'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Toggle Sidebar',
    description: 'Show or hide the sidebar',
    category: CommandCategory.VIEW,
    action: {
      type: CommandActionType.TOGGLE,
      setting: 'sidebar'
    },
    icon: 'PanelLeft',
    shortcut: {
      key: 's',
      modifiers: [ModifierKey.CTRL],
      description: 'Ctrl+S'
    },
    searchTerms: ['sidebar', 'panel', 'navigation', 'menu'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Open Notifications',
    description: 'View all notifications',
    category: CommandCategory.VIEW,
    action: {
      type: CommandActionType.OPEN_MODAL,
      modal: 'notifications'
    },
    icon: 'Bell',
    shortcut: {
      key: 'n',
      modifiers: [ModifierKey.ALT],
      description: 'Alt+N'
    },
    searchTerms: ['notifications', 'alerts', 'messages', 'updates'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },

  // Quick Actions
  {
    id: uuidv4(),
    name: 'Sign Out',
    description: 'Sign out of the application',
    category: CommandCategory.SYSTEM,
    action: {
      type: CommandActionType.EXECUTE,
      handler: 'signOut',
      params: {}
    },
    handler: () => {
      if (window.confirm('Are you sure you want to sign out?')) {
        console.log('Signing out...');
        // Implement actual sign out
      }
    },
    icon: 'LogOut',
    searchTerms: ['sign out', 'logout', 'exit', 'leave'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },

  // Help Commands
  {
    id: uuidv4(),
    name: 'Show Keyboard Shortcuts',
    description: 'Display all keyboard shortcuts',
    category: CommandCategory.HELP,
    action: {
      type: CommandActionType.OPEN_MODAL,
      modal: 'shortcuts'
    },
    icon: 'Keyboard',
    shortcut: {
      key: '?',
      modifiers: [],
      description: '?'
    },
    searchTerms: ['shortcuts', 'keyboard', 'hotkeys', 'keys', 'bindings'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Start Tutorial',
    description: 'Begin interactive tutorial',
    category: CommandCategory.HELP,
    action: {
      type: CommandActionType.EXECUTE,
      handler: 'startTutorial',
      params: {}
    },
    handler: () => {
      console.log('Starting tutorial...');
      useUIStore.getState().showToast(NotificationType.INFO, 'Tutorial', 'Starting interactive tutorial...');
      // Implement tutorial
    },
    icon: 'GraduationCap',
    searchTerms: ['tutorial', 'tour', 'guide', 'learn', 'help'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Documentation',
    description: 'Open documentation',
    category: CommandCategory.HELP,
    action: {
      type: CommandActionType.NAVIGATE,
      url: 'https://docs.centralcommand.io',
      target: '_blank'
    },
    icon: 'Book',
    searchTerms: ['documentation', 'docs', 'manual', 'guide', 'reference'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  },
  {
    id: uuidv4(),
    name: 'Report Issue',
    description: 'Report a bug or issue',
    category: CommandCategory.HELP,
    action: {
      type: CommandActionType.OPEN_MODAL,
      modal: 'reportIssue'
    },
    icon: 'Bug',
    searchTerms: ['report', 'bug', 'issue', 'problem', 'feedback'],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  }
];

/**
 * Generate filter commands for categories
 */
export const generateCategoryFilterCommands = (): ExtendedCommand[] => {
  return Object.values(PortalCategory)
    .filter(category => category !== PortalCategory.All)
    .map(category => ({
      id: uuidv4(),
      name: `Filter: ${category}`,
      description: `Show only ${category.toLowerCase()} portals`,
      category: CommandCategory.FILTER,
      action: {
        type: CommandActionType.FILTER,
        filters: { category }
      },
      icon: 'Filter',
      searchTerms: [category.toLowerCase(), 'filter', 'category'],
      enabled: true,
      favorite: false,
      usage: 0,
      requiresConfirmation: false,
      requiredPermissions: [],
      recent: false
    }));
};

/**
 * Generate time range commands
 */
export const generateTimeRangeCommands = (): ExtendedCommand[] => {
  const timeRanges = [
    { value: TimeRange.ONE_HOUR, label: 'Last Hour' },
    { value: TimeRange.TWENTY_FOUR_HOURS, label: 'Last 24 Hours' },
    { value: TimeRange.SEVEN_DAYS, label: 'Last 7 Days' },
    { value: TimeRange.THIRTY_DAYS, label: 'Last 30 Days' }
  ];

  return timeRanges.map(range => ({
    id: uuidv4(),
    name: `Time Range: ${range.label}`,
    description: `Set metrics time range to ${range.label}`,
    category: CommandCategory.FILTER,
    action: {
      type: CommandActionType.EXECUTE,
      handler: 'setTimeRange',
      params: { range: range.value }
    },
    handler: () => {
      useUIStore.getState().setTimeRange(range.value);
      useUIStore.getState().showToast(NotificationType.SUCCESS, 'Time Range Updated', `Showing data for ${range.label}`);
    },
    icon: 'Clock',
    searchTerms: ['time', 'range', 'period', range.label.toLowerCase()],
    enabled: true,
    favorite: false,
    usage: 0,
    requiresConfirmation: false,
    requiredPermissions: [],
    recent: false
  }));
};

/**
 * Get all default commands including generated ones
 */
export const getAllDefaultCommands = (): ExtendedCommand[] => [
  ...getDefaultCommands(),
  ...generateCategoryFilterCommands(),
  ...generateTimeRangeCommands()
];