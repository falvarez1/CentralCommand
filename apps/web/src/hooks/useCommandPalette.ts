import { useEffect, useCallback, useRef } from 'react';
import { useCommandStore } from '../stores/useCommandStore';
import { Command } from '../types/command.types';

/**
 * Custom hook for command palette functionality
 */
export function useCommandPalette() {
  const {
    commands,
    recentCommands,
    searchQuery,
    searchResults,
    isOpen,
    selectedIndex,
    searchCommands,
    executeCommand,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
    selectNext,
    selectPrevious,
    executeSelected,
    initialize
  } = useCommandStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize command store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in an input (except command palette input)
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (target !== inputRef.current) return;
      }

      // Command palette shortcuts
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Navigation within command palette
      if (isOpen) {
        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            closeCommandPalette();
            break;
          case 'ArrowDown':
            event.preventDefault();
            selectNext();
            break;
          case 'ArrowUp':
            event.preventDefault();
            selectPrevious();
            break;
          case 'Enter':
            event.preventDefault();
            executeSelected();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleCommandPalette, closeCommandPalette, selectNext, selectPrevious, executeSelected]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handlers
  const handleSearch = useCallback((query: string) => {
    searchCommands(query);
  }, [searchCommands]);

  const handleExecute = useCallback((command: Command) => {
    executeCommand(command.id);
    if (command.actionType !== 'toggle') {
      closeCommandPalette();
    }
  }, [executeCommand, closeCommandPalette]);

  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    return useCommandStore.getState().handleKeyboardShortcut(event);
  }, []);

  return {
    // State
    isOpen,
    searchQuery,
    searchResults,
    selectedIndex,
    commands,
    recentCommands,

    // Refs
    inputRef,

    // Actions
    open: openCommandPalette,
    close: closeCommandPalette,
    toggle: toggleCommandPalette,
    search: handleSearch,
    execute: handleExecute,
    selectNext,
    selectPrevious,
    executeSelected,
    handleKeyboardShortcut
  };
}

/**
 * Hook for registering custom commands
 */
export function useRegisterCommand(command: Omit<Command, 'id'>) {
  const registerCommand = useCommandStore(state => state.registerCommand);
  const unregisterCommand = useCommandStore(state => state.unregisterCommand);

  const commandRef = useRef<Command | null>(null);

  useEffect(() => {
    const fullCommand: Command = {
      ...command,
      id: command.name.toLowerCase().replace(/\s+/g, '-')
    };

    commandRef.current = fullCommand;
    registerCommand(fullCommand);

    return () => {
      if (commandRef.current) {
        unregisterCommand(commandRef.current.id);
      }
    };
  }, [command, registerCommand, unregisterCommand]);
}

/**
 * Hook for command categories
 */
export function useCommandCategories() {
  const commands = useCommandStore(state => state.commands);

  const categorizedCommands = commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  return categorizedCommands;
}

/**
 * Hook for command history
 */
export function useCommandHistory() {
  const commandHistory = useCommandStore(state => state.commandHistory);
  const commands = useCommandStore(state => state.commands);
  const clearHistory = useCommandStore(state => state.clearHistory);

  const historyWithCommands = commandHistory.map(entry => ({
    ...entry,
    command: commands.find(c => c.id === entry.commandId)
  })).filter(entry => entry.command);

  const mostUsedCommands = commandHistory.reduce((acc, entry) => {
    acc[entry.commandId] = (acc[entry.commandId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCommands = [...Object.entries(mostUsedCommands)]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([commandId]) => commands.find(c => c.id === commandId))
    .filter(Boolean) as Command[];

  return {
    history: historyWithCommands,
    topCommands,
    clearHistory
  };
}

/**
 * Hook for pinned commands
 */
export function usePinnedCommands() {
  const commands = useCommandStore(state => state.commands);
  const pinCommand = useCommandStore(state => state.pinCommand);
  const unpinCommand = useCommandStore(state => state.unpinCommand);

  const pinnedCommands = commands.filter(c => c.isPinned);

  const togglePin = useCallback((commandId: string) => {
    const command = commands.find(c => c.id === commandId);
    if (command) {
      if (command.isPinned) {
        unpinCommand(commandId);
      } else {
        pinCommand(commandId);
      }
    }
  }, [commands, pinCommand, unpinCommand]);

  return {
    pinnedCommands,
    togglePin
  };
}