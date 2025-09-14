# Command Palette System

A comprehensive command palette system for the Central Command React application that provides quick access to all application features through keyboard shortcuts and fuzzy search.

## Features

- **Global Keyboard Shortcut**: Open with `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- **Fuzzy Search**: Smart search algorithm that matches commands by name, description, and search terms
- **Keyboard Navigation**: Navigate with arrow keys, select with Enter, close with Escape
- **Command Categories**: Organized commands by category (Navigation, Portal, System, etc.)
- **Recent Commands**: Shows recently used commands for quick access
- **Favorite Commands**: Pin frequently used commands
- **Dynamic Commands**: Automatically generates commands based on portal data
- **Keyboard Shortcuts**: Display and execute keyboard shortcuts for commands
- **Confirmation Dialogs**: Critical actions require confirmation
- **Usage Tracking**: Tracks command usage for better suggestions
- **Responsive Design**: Works on mobile and desktop

## Components

### CommandPalette.tsx
Main command palette UI component that renders the modal dialog with search and command list.

### CommandPaletteProvider.tsx
Context provider that manages global state, keyboard listeners, and command registration.

### CommandItem.tsx
Individual command item component with icon, description, shortcuts, and badges.

### useCommandSearch.ts
Custom hook implementing fuzzy search algorithm with scoring and highlighting.

### commands.ts
Command definitions and execution handlers for all default and generated commands.

## Usage

### Basic Setup

```tsx
import { CommandPaletteProvider } from '@/components/command-palette';

function App() {
  return (
    <CommandPaletteProvider>
      {/* Your app content */}
    </CommandPaletteProvider>
  );
}
```

### Register Custom Commands

```tsx
import { useCommandPalette } from '@/components/command-palette';

function MyComponent() {
  const { registerCommand } = useCommandPalette();

  useEffect(() => {
    const commandId = registerCommand({
      name: 'My Custom Command',
      description: 'Does something special',
      category: CommandCategory.SYSTEM,
      action: {
        type: CommandActionType.EXECUTE,
        handler: 'myHandler',
        params: {}
      },
      handler: () => {
        console.log('Custom command executed!');
      },
      icon: 'Star',
      searchTerms: ['custom', 'special'],
      enabled: true
    });

    return () => unregisterCommand(commandId);
  }, []);
}
```

## Command Categories

### Navigation
- Go to Dashboard (Alt+D)
- View All Portals (Alt+P)
- View Incidents (Alt+I)
- View Settings (Ctrl+,)

### Portal Actions
- Add New Portal (Ctrl+N)
- Search Portals (/)
- View Favorites
- Export Portal Data (Ctrl+Shift+E)

### System Actions
- Deploy All Services
- Run Health Check (Ctrl+Shift+H)
- Schedule Maintenance
- Emergency Shutdown
- Refresh Data (Ctrl+R)

### View Controls
- Toggle Theme (Ctrl+Shift+T)
- Toggle View (Alt+V)
- Toggle Sidebar (Ctrl+S)
- Open Notifications (Alt+N)

### Quick Actions
- Sign Out

### Help
- Show Keyboard Shortcuts (?)
- Start Tutorial
- Documentation
- Report Issue

### Filters
- Category filters (Business, Development, Infrastructure, etc.)
- Time range filters (Last Hour, 24 Hours, 7 Days, 30 Days)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `↑↓` | Navigate commands |
| `Enter` | Execute selected command |
| `Escape` | Close palette |
| `/` | Search portals |
| `?` | Show help |
| `Alt + D` | Go to dashboard |
| `Alt + P` | View portals |
| `Alt + I` | View incidents |
| `Ctrl + N` | Add new portal |
| `Ctrl + R` | Refresh data |
| `Ctrl + Shift + T` | Toggle theme |
| `Ctrl + Shift + E` | Export data |
| `Ctrl + Shift + H` | Run health check |

## Search Algorithm

The fuzzy search algorithm scores commands based on:

1. **Exact Match** (100 points): Command name exactly matches query
2. **Starts With** (50 points): Command name starts with query
3. **Contains** (30 points): Command name contains query
4. **Description Match** (20 points): Description contains query
5. **Search Terms** (15 points): Search terms match query
6. **Fuzzy Match** (10 points): Characters appear in order
7. **Recent Bonus** (25 points): Recently used commands
8. **Favorite Bonus** (20 points): Favorite commands
9. **Usage Frequency** (up to 10 points): Based on usage count

## Customization

### Adding New Command Types

1. Add new action type to `CommandActionType` enum in `command.types.ts`
2. Add handler in `executeCommandAction` function in `commands.ts`
3. Create command definition in `getDefaultCommands`

### Styling

The command palette uses Tailwind CSS and ShadCN UI components. Customize styles by:

1. Modifying component classes in `CommandPalette.tsx`
2. Updating theme variables in your CSS
3. Customizing ShadCN command component styles

### Search Customization

Adjust search behavior in `useCommandSearch.ts`:

```tsx
const options = {
  threshold: 0.6,        // Match threshold (0-1)
  includeScore: true,    // Include match scores
  keys: ['name', 'description', 'searchTerms'],  // Fields to search
  minMatchCharLength: 2  // Minimum characters to start search
};
```

## Performance Considerations

- Commands are memoized to prevent unnecessary re-renders
- Search results are debounced by 150ms
- Dynamic commands are regenerated with 500ms debounce
- Command execution is async to prevent UI blocking
- Large command lists are virtualized (if needed)

## Accessibility

- Full keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader compatible
- High contrast mode support

## Future Enhancements

- [ ] Command history persistence in localStorage
- [ ] Command aliases
- [ ] Multi-step commands
- [ ] Command chaining
- [ ] Custom keyboard shortcut configuration
- [ ] Command import/export
- [ ] AI-powered command suggestions
- [ ] Voice commands
- [ ] Command macros
- [ ] Plugin system for custom commands