import React, { useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { useCommandStore } from '@/stores/useCommandStore';
import { usePortalStore } from '@/stores/usePortalStore';
import { CommandActionType, CommandCategory } from '@/types/command.types';
import { v4 as uuidv4 } from 'uuid';
import { PortalStatus } from '@/types/portal.types';
import CommandPalette from './CommandPalette';
import {
  ExtendedCommand,
  toCommand,
  executeCommandAction,
  getAllDefaultCommands
} from './commands';

/**
 * Command Palette Context
 */
interface CommandPaletteContextValue {
  registerCommand: (command: ExtendedCommand) => string;
  unregisterCommand: (id: string) => void;
  executeCommand: (id: string) => Promise<void>;
  registerDynamicCommands: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
};

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const commandStore = useCommandStore();
  const portalStore = usePortalStore();
  const commandsMap = useRef<Map<string, ExtendedCommand>>(new Map());

  // Initialize commands on mount
  useEffect(() => {
    if (commandStore.commands.length === 0) {
      commandStore.initialize();
      registerDefaultCommands();
    }

    // Set up global keyboard listener for Cmd+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Cmd+K even in inputs
        if (!((e.metaKey || e.ctrlKey) && e.key === 'k')) {
          return;
        }
      }

      // Check for Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandStore.toggleCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Register default commands
  const registerDefaultCommands = useCallback(() => {
    const defaultCommands = getAllDefaultCommands();

    defaultCommands.forEach(extCommand => {
      // Store the extended command with handler
      commandsMap.current.set(extCommand.id, extCommand);

      // Register the command in the store (without handler)
      const command = toCommand(extCommand);

      // Create a wrapper function for the action
      const commandWithAction = {
        ...command,
        action: async () => {
          await executeCommandAction(extCommand);
        }
      } as any;

      commandStore.registerCommand(commandWithAction);
    });

    // Register dynamic portal commands
    registerDynamicPortalCommands();
  }, [commandStore]);

  // Register dynamic portal commands
  const registerDynamicPortalCommands = useCallback(() => {
    const portals = portalStore.portals;

    // Add quick open commands for favorite portals
    portals
      .filter(portal => portal.isFavorite && portal.status === PortalStatus.Operational)
      .slice(0, 5)
      .forEach(portal => {
        const extCommand: ExtendedCommand = {
          id: `portal-open-${portal.id}`,
          name: `Open ${portal.name}`,
          description: `Quick access to ${portal.name}`,
          category: CommandCategory.PORTAL,
          action: {
            type: CommandActionType.NAVIGATE,
            url: portal.url,
            target: '_blank'
          },
          icon: 'ExternalLink',
          searchTerms: [portal.name.toLowerCase(), 'open', 'portal', 'quick'],
          enabled: true,
          favorite: true,
          usage: 0,
          requiresConfirmation: false,
          requiredPermissions: [],
          recent: false
        };

        commandsMap.current.set(extCommand.id, extCommand);

        const commandWithAction = {
          ...toCommand(extCommand),
          action: async () => {
            await executeCommandAction(extCommand);
          }
        } as any;

        commandStore.registerCommand(commandWithAction);
      });
  }, [portalStore.portals, commandStore]);

  // Register a new command
  const registerCommand = useCallback((command: ExtendedCommand): string => {
    const id = command.id || uuidv4();
    const commandWithId = { ...command, id };

    // Store the extended command
    commandsMap.current.set(id, commandWithId);

    // Register in store with action wrapper
    const commandWithAction = {
      ...toCommand(commandWithId),
      action: async () => {
        await executeCommandAction(commandWithId);
      }
    } as any;

    commandStore.registerCommand(commandWithAction);
    return id;
  }, [commandStore]);

  // Unregister a command
  const unregisterCommand = useCallback((id: string) => {
    commandsMap.current.delete(id);
    commandStore.unregisterCommand(id);
  }, [commandStore]);

  // Execute a command
  const executeCommand = useCallback(async (id: string) => {
    const extCommand = commandsMap.current.get(id);
    if (extCommand) {
      // Update usage count
      extCommand.usage = (extCommand.usage || 0) + 1;

      // Check for confirmation
      if (extCommand.requiresConfirmation) {
        const confirmed = window.confirm(`Are you sure you want to ${extCommand.name}?`);
        if (!confirmed) return;
      }

      // Execute the command
      await executeCommandAction(extCommand);

      // Mark as recent
      commandStore.addToHistory(id);

      // Close palette for navigation commands
      if (extCommand.action.type === CommandActionType.NAVIGATE) {
        commandStore.closeCommandPalette();
      }
    } else {
      // Fallback to store's execute method
      commandStore.executeCommand(id);
    }
  }, [commandStore]);

  // Register dynamic commands when data changes
  const registerDynamicCommands = useCallback(() => {
    // Clear existing dynamic commands
    Array.from(commandsMap.current.keys())
      .filter(id => id.startsWith('portal-open-'))
      .forEach(id => unregisterCommand(id));

    // Register new dynamic commands
    registerDynamicPortalCommands();
  }, [registerDynamicPortalCommands, unregisterCommand]);

  // Listen for portal changes to update dynamic commands
  useEffect(() => {
    const unsubscribe = usePortalStore.subscribe(
      (state) => state.portals,
      registerDynamicCommands
    );

    return () => {
      unsubscribe();
    };
  }, [registerDynamicCommands]);

  const value: CommandPaletteContextValue = {
    registerCommand,
    unregisterCommand,
    executeCommand,
    registerDynamicCommands
  };

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
};

export default CommandPaletteProvider;