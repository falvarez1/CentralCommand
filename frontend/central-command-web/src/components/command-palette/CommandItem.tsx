import React, { memo } from 'react';
import * as Icons from 'lucide-react';
import { Command, ModifierKey } from '@/types/command.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CommandShortcut } from '@/components/ui/command';

interface CommandItemProps {
  command: Command;
  isSelected?: boolean;
  onClick?: (command: Command) => void;
  showCategory?: boolean;
  showShortcut?: boolean;
  showBadges?: boolean;
  highlightedIndices?: Array<[number, number]>;
  className?: string;
}

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
  if (key === 'Escape') key = 'Esc';
  if (key.length === 1) key = key.toUpperCase();

  parts.push(key);
  return parts.join(isMac ? '' : '+');
};

/**
 * Render text with highlighted portions
 */
const HighlightedText: React.FC<{
  text: string;
  indices?: Array<[number, number]>;
}> = ({ text, indices }) => {
  if (!indices || indices.length === 0) {
    return <>{text}</>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  indices.forEach(([start, end], i) => {
    // Add non-highlighted text before this match
    if (lastIndex < start) {
      parts.push(
        <span key={`text-${i}`}>
          {text.substring(lastIndex, start)}
        </span>
      );
    }

    // Add highlighted text
    parts.push(
      <mark
        key={`mark-${i}`}
        className="bg-yellow-200 dark:bg-yellow-900 text-inherit rounded-sm px-0.5"
      >
        {text.substring(start, end + 1)}
      </mark>
    );

    lastIndex = end + 1;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
};

/**
 * Get icon component by name
 */
const DynamicIcon = ({ name, className }: { name?: string; className?: string }) => {
  if (!name) return null;

  const IconComponent = (Icons as any)[name];
  if (!IconComponent) {
    // Fallback to a default icon if not found
    return <Icons.Command className={className} />;
  }

  return <IconComponent className={className} />;
};

/**
 * Individual command item component
 */
const CommandItem: React.FC<CommandItemProps> = memo(({
  command,
  isSelected = false,
  onClick,
  showCategory = false,
  showShortcut = true,
  showBadges = true,
  highlightedIndices,
  className
}) => {
  const handleClick = () => {
    if (onClick && command.enabled) {
      onClick(command);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        !command.enabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      role="option"
      aria-selected={isSelected}
      aria-disabled={!command.enabled}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <DynamicIcon
          name={command.icon}
          className={cn(
            "h-4 w-4",
            isSelected ? "text-accent-foreground" : "text-muted-foreground"
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Name */}
          <span className="text-sm font-medium truncate">
            <HighlightedText text={command.name} indices={highlightedIndices} />
          </span>

          {/* Badges */}
          {showBadges && (
            <div className="flex items-center gap-1">
              {command.recent && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Recent
                </Badge>
              )}
              {command.favorite && (
                <Icons.Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              )}
              {command.requiresConfirmation && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  Confirm
                </Badge>
              )}
              {!command.enabled && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  Disabled
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {command.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {command.description}
          </p>
        )}

        {/* Category */}
        {showCategory && (
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {command.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Shortcut */}
      {showShortcut && command.shortcut && (
        <div className="flex-shrink-0">
          <CommandShortcut className="text-xs">
            {formatShortcut(command.shortcut)}
          </CommandShortcut>
        </div>
      )}

      {/* Usage indicator */}
      {command.usage && command.usage > 10 && (
        <div
          className="flex-shrink-0"
          title={`Used ${command.usage} times`}
        >
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(3, Math.floor(command.usage / 10)) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 w-1 rounded-full",
                  isSelected ? "bg-accent-foreground" : "bg-muted-foreground"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

CommandItem.displayName = 'CommandItem';

export default CommandItem;