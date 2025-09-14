import { z } from 'zod';

/**
 * Command action types
 */
export enum CommandActionType {
  NAVIGATE = 'navigate',
  EXECUTE = 'execute',
  TOGGLE = 'toggle',
  SEARCH = 'search',
  FILTER = 'filter',
  CREATE = 'create',
  DELETE = 'delete',
  UPDATE = 'update',
  EXPORT = 'export',
  IMPORT = 'import',
  REFRESH = 'refresh',
  OPEN_MODAL = 'openModal',
  CLOSE_MODAL = 'closeModal',
  SYSTEM = 'system'
}

/**
 * Command categories for grouping
 */
export enum CommandCategory {
  NAVIGATION = 'navigation',
  PORTAL = 'portal',
  INCIDENT = 'incident',
  SYSTEM = 'system',
  VIEW = 'view',
  DATA = 'data',
  SETTINGS = 'settings',
  HELP = 'help'
}

/**
 * Keyboard modifier keys
 */
export enum ModifierKey {
  CTRL = 'ctrl',
  ALT = 'alt',
  SHIFT = 'shift',
  META = 'meta' // Command key on Mac
}

/**
 * Zod schema for keyboard shortcut
 */
export const KeyboardShortcutSchema = z.object({
  key: z.string().min(1).max(20),
  modifiers: z.array(z.nativeEnum(ModifierKey)).default([]),
  description: z.string().optional()
});

export interface KeyboardShortcut extends z.infer<typeof KeyboardShortcutSchema> {}

/**
 * Zod schema for command action
 */
export const CommandActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(CommandActionType.NAVIGATE),
    url: z.string(),
    target: z.enum(['_self', '_blank', '_parent', '_top']).optional()
  }),
  z.object({
    type: z.literal(CommandActionType.EXECUTE),
    handler: z.string(), // Function name to execute
    params: z.record(z.any()).optional()
  }),
  z.object({
    type: z.literal(CommandActionType.TOGGLE),
    setting: z.string(),
    value: z.boolean().optional()
  }),
  z.object({
    type: z.literal(CommandActionType.SEARCH),
    query: z.string(),
    scope: z.enum(['all', 'portals', 'incidents', 'users']).optional()
  }),
  z.object({
    type: z.literal(CommandActionType.FILTER),
    filters: z.record(z.any())
  }),
  z.object({
    type: z.literal(CommandActionType.CREATE),
    entity: z.enum(['portal', 'incident', 'user', 'team']),
    data: z.record(z.any()).optional()
  }),
  z.object({
    type: z.literal(CommandActionType.DELETE),
    entity: z.enum(['portal', 'incident', 'user', 'team']),
    id: z.string()
  }),
  z.object({
    type: z.literal(CommandActionType.UPDATE),
    entity: z.enum(['portal', 'incident', 'user', 'team']),
    id: z.string(),
    data: z.record(z.any())
  }),
  z.object({
    type: z.literal(CommandActionType.EXPORT),
    format: z.enum(['json', 'csv', 'pdf', 'excel']),
    data: z.enum(['portals', 'incidents', 'stats', 'all']).optional()
  }),
  z.object({
    type: z.literal(CommandActionType.IMPORT),
    format: z.enum(['json', 'csv', 'excel']),
    entity: z.enum(['portals', 'incidents', 'users'])
  }),
  z.object({
    type: z.literal(CommandActionType.REFRESH),
    target: z.enum(['all', 'portals', 'incidents', 'stats']).optional()
  }),
  z.object({
    type: z.literal(CommandActionType.OPEN_MODAL),
    modal: z.string()
  }),
  z.object({
    type: z.literal(CommandActionType.CLOSE_MODAL),
    modal: z.string().optional()
  }),
  z.object({
    type: z.literal(CommandActionType.SYSTEM),
    command: z.enum(['shutdown', 'restart', 'maintenance', 'healthcheck', 'deploy'])
  })
]);

export type CommandAction = z.infer<typeof CommandActionSchema>;

/**
 * Zod schema for Command
 */
export const CommandSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  category: z.nativeEnum(CommandCategory),
  action: CommandActionSchema,
  shortcut: KeyboardShortcutSchema.optional(),
  enabled: z.boolean().default(true),
  requiresConfirmation: z.boolean().default(false),
  requiredPermissions: z.array(z.string()).default([]),
  searchTerms: z.array(z.string()).default([]),
  recent: z.boolean().default(false),
  favorite: z.boolean().default(false),
  usage: z.number().nonnegative().default(0)
});

/**
 * TypeScript interface for Command
 * @interface Command
 * @description Represents a command in the command palette
 */
export interface Command extends z.infer<typeof CommandSchema> {}

/**
 * Command execution context
 */
export const CommandContextSchema = z.object({
  userId: z.string().uuid(),
  timestamp: z.date(),
  source: z.enum(['palette', 'shortcut', 'menu', 'api']),
  previousCommand: z.string().optional(),
  sessionId: z.string().uuid().optional()
});

export interface CommandContext extends z.infer<typeof CommandContextSchema> {}

/**
 * Command execution result
 */
export const CommandResultSchema = z.object({
  success: z.boolean(),
  commandId: z.string(),
  executedAt: z.date(),
  duration: z.number().nonnegative(), // in milliseconds
  result: z.any().optional(),
  error: z.string().optional(),
  affectedEntities: z.array(z.object({
    type: z.string(),
    id: z.string()
  })).optional()
});

export interface CommandResult extends z.infer<typeof CommandResultSchema> {}

/**
 * Command palette state
 */
export const CommandPaletteStateSchema = z.object({
  isOpen: z.boolean(),
  searchQuery: z.string().default(''),
  selectedIndex: z.number().nonnegative().default(0),
  filteredCommands: z.array(CommandSchema),
  recentCommands: z.array(z.string()),
  favoriteCommands: z.array(z.string()),
  category: z.nativeEnum(CommandCategory).optional()
});

export interface CommandPaletteState extends z.infer<typeof CommandPaletteStateSchema> {}

/**
 * Keyboard shortcut mapping
 */
export const ShortcutMappingSchema = z.record(
  z.string(), // Shortcut key combination
  z.string()  // Command ID
);

export interface ShortcutMapping extends z.infer<typeof ShortcutMappingSchema> {}

/**
 * Command history entry
 */
export const CommandHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  commandId: z.string(),
  commandName: z.string(),
  executedAt: z.date(),
  userId: z.string().uuid(),
  context: CommandContextSchema,
  result: CommandResultSchema
});

export interface CommandHistoryEntry extends z.infer<typeof CommandHistoryEntrySchema> {}

/**
 * Predefined keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS: Record<string, KeyboardShortcut> = {
  OPEN_COMMAND_PALETTE: {
    key: 'k',
    modifiers: [ModifierKey.CTRL],
    description: 'Open command palette'
  },
  SEARCH: {
    key: '/',
    modifiers: [],
    description: 'Focus search'
  },
  TOGGLE_THEME: {
    key: 't',
    modifiers: [ModifierKey.CTRL, ModifierKey.SHIFT],
    description: 'Toggle theme'
  },
  REFRESH: {
    key: 'r',
    modifiers: [ModifierKey.CTRL],
    description: 'Refresh data'
  },
  NEW_PORTAL: {
    key: 'n',
    modifiers: [ModifierKey.CTRL],
    description: 'Create new portal'
  },
  NEW_INCIDENT: {
    key: 'i',
    modifiers: [ModifierKey.CTRL],
    description: 'Create new incident'
  },
  ESCAPE: {
    key: 'Escape',
    modifiers: [],
    description: 'Close modal or palette'
  },
  SAVE: {
    key: 's',
    modifiers: [ModifierKey.CTRL],
    description: 'Save changes'
  },
  EXPORT: {
    key: 'e',
    modifiers: [ModifierKey.CTRL, ModifierKey.SHIFT],
    description: 'Export data'
  },
  HELP: {
    key: '?',
    modifiers: [],
    description: 'Show help'
  }
};