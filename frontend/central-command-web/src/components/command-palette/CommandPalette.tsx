import React, { useEffect, useState, useCallback, useMemo } from 'react';
import * as Icons from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '@/components/ui/command';
import { useCommandStore } from '@/stores/useCommandStore';
import { CommandCategory, Command, ModifierKey } from '@/types/command.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * Icon component that dynamically renders icons from lucide-react
 */
const DynamicIcon = ({ name, className }: { name?: string; className?: string }) => {
  if (!name) return null;

  // Try to get the icon from lucide-react
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return null;

  return <IconComponent className={className} />;
};

/**
 * Format keyboard shortcut for display
 */
const formatShortcut = (shortcut: { key: string; modifiers: ModifierKey[] }): string => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierSymbols: Record<ModifierKey, string> = {
    [ModifierKey.CTRL]: isMac ? '⌘' : 'Ctrl',
    [ModifierKey.ALT]: isMac ? '⌥' : 'Alt',
    [ModifierKey.SHIFT]: isMac ? '⇧' : 'Shift',
    [ModifierKey.META]: '⌘'
  };

  const parts = shortcut.modifiers
    .map(mod => modifierSymbols[mod])
    .filter(Boolean);

  // Format the key
  let key = shortcut.key;
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();

  parts.push(key);
  return parts.join(isMac ? '' : '+');
};

/**
 * Category labels for display
 */
const categoryLabels: Record<CommandCategory, string> = {
  [CommandCategory.NAVIGATION]: 'Navigation',
  [CommandCategory.PORTAL]: 'Portal Actions',
  [CommandCategory.INCIDENT]: 'Incident Management',
  [CommandCategory.SYSTEM]: 'System Operations',
  [CommandCategory.VIEW]: 'View Controls',
  [CommandCategory.DATA]: 'Data Operations',
  [CommandCategory.SETTINGS]: 'Settings',
  [CommandCategory.HELP]: 'Help & Support',
  [CommandCategory.FILTER]: 'Filters'
};

/**
 * Category icons
 */
const categoryIcons: Record<CommandCategory, string> = {
  [CommandCategory.NAVIGATION]: 'Navigation',
  [CommandCategory.PORTAL]: 'Grid3x3',
  [CommandCategory.INCIDENT]: 'AlertTriangle',
  [CommandCategory.SYSTEM]: 'Terminal',
  [CommandCategory.VIEW]: 'Eye',
  [CommandCategory.DATA]: 'Database',
  [CommandCategory.SETTINGS]: 'Settings',
  [CommandCategory.HELP]: 'HelpCircle',
  [CommandCategory.FILTER]: 'Filter'
};

/**
 * Fuzzy search algorithm
 */
const fuzzyMatch = (query: string, text: string): boolean => {
  const pattern = query.toLowerCase().split('').join('.*');
  const regex = new RegExp(pattern);
  return regex.test(text.toLowerCase());
};

/**
 * Score a command based on search relevance
 */
const scoreCommand = (command: Command, query: string): number => {
  const lowerQuery = query.toLowerCase();
  let score = 0;

  // Exact name match
  if (command.name.toLowerCase() === lowerQuery) score += 100;

  // Name starts with query
  if (command.name.toLowerCase().startsWith(lowerQuery)) score += 50;

  // Name contains query
  if (command.name.toLowerCase().includes(lowerQuery)) score += 30;

  // Description contains query
  if (command.description?.toLowerCase().includes(lowerQuery)) score += 20;

  // Search terms match
  if (command.searchTerms?.some(term => term.toLowerCase().includes(lowerQuery))) score += 15;

  // Fuzzy match on name
  if (fuzzyMatch(query, command.name)) score += 10;

  // Recent command bonus
  if (command.recent) score += 25;

  // Favorite command bonus
  if (command.favorite) score += 20;

  // Usage frequency bonus
  score += Math.min(command.usage || 0, 10);

  return score;
};

export const CommandPalette: React.FC = () => {
  const {
    isOpen,
    searchQuery,
    searchResults,
    selectedIndex,
    recentCommands,
    commands,
    openCommandPalette,
    closeCommandPalette,
    searchCommands,
    executeCommand,
    selectNext,
    selectPrevious,
    executeSelected
  } = useCommandStore();

  const [localQuery, setLocalQuery] = useState('');

  // Initialize command store on mount
  useEffect(() => {
    const store = useCommandStore.getState();
    if (store.commands.length === 0) {
      store.initialize();
    }
  }, []);

  // Sync local query with store
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCommands(localQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [localQuery, searchCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory | "recent" | "pinned", Command[]> = {} as any;

    // Initialize empty arrays for each category
    Object.values(CommandCategory).forEach(category => {
      groups[category] = [];
    });

    // If no search query, show recent and pinned commands
    if (!localQuery) {
      const pinnedCommands = commands.filter(c => c.favorite && c.enabled);
      const recentCommandObjects = recentCommands
        .map(id => commands.find(c => c.id === id))
        .filter(Boolean) as Command[];

      if (recentCommandObjects.length > 0 || pinnedCommands.length > 0) {
        const result: Record<string, Command[]> = {};
        if (recentCommandObjects.length > 0) {
          result.recent = recentCommandObjects;
        }
        if (pinnedCommands.length > 0) {
          result.pinned = pinnedCommands.filter(c => !recentCommandObjects.some(r => r.id === c.id));
        }
        // Don't spread empty groups, only add non-empty categories
        Object.entries(groups).forEach(([key, cmds]) => {
          if (cmds.length > 0) {
            result[key] = cmds;
          }
        });
        return result as Record<CommandCategory | "recent" | "pinned", Command[]>;
      }
    }

    // Score and sort commands
    const scoredResults = [...searchResults]
      .map(cmd => ({ command: cmd, score: scoreCommand(cmd, localQuery) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Group by category
    scoredResults.forEach(({ command }) => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key as CommandCategory].length === 0) {
        delete groups[key as CommandCategory];
      }
    });

    return groups;
  }, [searchResults, localQuery, commands, recentCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          executeSelected();
          break;
        case 'Escape':
          e.preventDefault();
          closeCommandPalette();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectNext, selectPrevious, executeSelected, closeCommandPalette]);

  // Handle command execution
  const handleCommandSelect = useCallback((command: Command) => {
    executeCommand(command.id);
    if (command.action.type !== 'openModal') {
      closeCommandPalette();
    }
  }, [executeCommand, closeCommandPalette]);

  // Calculate flat index for keyboard navigation
  const getFlatIndex = useCallback((groupKey: string, itemIndex: number): number => {
    let flatIndex = 0;
    const groupKeys = Object.keys(groupedCommands);

    for (let i = 0; i < groupKeys.length; i++) {
      const key = groupKeys[i];
      if (key === groupKey) {
        return flatIndex + itemIndex;
      }
      flatIndex += (groupedCommands[key as CommandCategory] || []).length;
    }

    return flatIndex;
  }, [groupedCommands]);

  // Check if item is selected
  const isItemSelected = useCallback((groupKey: string, itemIndex: number): boolean => {
    return getFlatIndex(groupKey, itemIndex) === selectedIndex;
  }, [getFlatIndex, selectedIndex]);

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => open ? openCommandPalette() : closeCommandPalette()}>
      <CommandInput
        placeholder="Type a command or search..."
        value={localQuery}
        onValueChange={setLocalQuery}
        className="h-12"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          No results found for "{localQuery}"
        </CommandEmpty>

        {/* Recent Commands */}
        {groupedCommands["recent"] && groupedCommands["recent"].length > 0 && (
          <>
            <CommandGroup heading="Recent">
                  {"recent" in groupedCommands && groupedCommands["recent"]?.map((command, index) => (
                <CommandItem
                  key={command.id}
                  value={command.name}
                  onSelect={() => handleCommandSelect(command)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2",
                    isItemSelected('recent', index) && "bg-accent"
                  )}
                >
                  <DynamicIcon name={command.icon} className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{command.name}</span>
                      {command.description && (
                        <span className="text-xs text-muted-foreground">{command.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Recent</Badge>
                      {command.shortcut && (
                        <CommandShortcut>
                          {formatShortcut(command.shortcut)}
                        </CommandShortcut>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Pinned Commands */}
        {groupedCommands["pinned"] && groupedCommands["pinned"].length > 0 && (
          <>
            <CommandGroup heading="Pinned">
                  {"pinned" in groupedCommands && groupedCommands["pinned"]?.map((command, index) => (
                <CommandItem
                  key={command.id}
                  value={command.name}
                  onSelect={() => handleCommandSelect(command)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2",
                    isItemSelected('pinned', index) && "bg-accent"
                  )}
                >
                  <DynamicIcon name={command.icon} className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{command.name}</span>
                      {command.description && (
                        <span className="text-xs text-muted-foreground">{command.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icons.Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {command.shortcut && (
                        <CommandShortcut>
                          {formatShortcut(command.shortcut)}
                        </CommandShortcut>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Grouped Commands by Category */}
        {Object.entries(groupedCommands)
          .filter(([key]) => key !== 'recent' && key !== 'pinned')
          .map(([category, categoryCommands], groupIndex) => {
            if (categoryCommands.length === 0) return null;

            return (
              <CommandGroup
                key={category}
                heading={
                  <div className="flex items-center gap-2">
                    <DynamicIcon name={categoryIcons[category as CommandCategory]} className="h-3 w-3" />
                    <span>{categoryLabels[category as CommandCategory] || category}</span>
                  </div>
                }
              >
                {categoryCommands.map((command, index) => (
                  <CommandItem
                    key={command.id}
                    value={command.name}
                    onSelect={() => handleCommandSelect(command)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2",
                      isItemSelected(category, index) && "bg-accent"
                    )}
                  >
                    <DynamicIcon name={command.icon} className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{command.name}</span>
                        {command.description && (
                          <span className="text-xs text-muted-foreground">{command.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {command.requiresConfirmation && (
                          <Badge variant="destructive" className="text-xs">Confirm</Badge>
                        )}
                        {command.favorite && (
                          <Icons.Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        )}
                        {command.shortcut && (
                          <CommandShortcut>
                            {formatShortcut(command.shortcut)}
                          </CommandShortcut>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
      </CommandList>

      {/* Footer with tips */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ↵
            </kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              esc
            </kbd>
            Close
          </span>
        </div>
        <span>
          Type <span className="font-semibold">?</span> for help
        </span>
      </div>
    </CommandDialog>
  );
};

export default CommandPalette;