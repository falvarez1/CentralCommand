# Central Command React

A modern React application built with TypeScript, Vite, and best practices for enterprise portal management.

## Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript 5.x** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router 7** - Client-side routing
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **Lucide React** - Modern icon library
- **Tailwind CSS** - Utility-first CSS framework
- **Zod** - Runtime type validation

## Project Structure

```
central-command-react/
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and helpers
│   ├── stores/       # Zustand state stores
│   ├── types/        # TypeScript type definitions
│   └── styles/       # Global styles
├── public/           # Static assets
└── index.html       # Main HTML file
```

## Features

### Core Functionality
- Portal monitoring and management
- Real-time metrics dashboard
- Incident tracking system
- Command palette (Cmd/Ctrl + K)
- Dark/Light theme support
- Grid/List view toggles

### State Management
- Global app state with Zustand
- Persistent state for user preferences
- Server state caching with TanStack Query

### Developer Experience
- Path aliases for clean imports (@components, @pages, etc.)
- Custom hooks for common patterns
- Type-safe validation with Zod
- Utility functions for data manipulation

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server at http://localhost:5173
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Development

### Path Aliases

The project uses path aliases for cleaner imports:

```typescript
import { Component } from '@components/Component'
import { useCustomHook } from '@hooks/useCustomHook'
import { utility } from '@lib/utils'
import { useAppStore } from '@stores/useAppStore'
import type { Portal } from '@types/index'
```

### Custom Hooks

Available custom hooks:
- `useKeyboardShortcut` - Keyboard shortcut management
- `useMediaQuery` - Responsive design utilities
- `useDebounce` - Debounced values and callbacks
- `useLocalStorage` - Local storage with sync

### Store Structure

The app uses Zustand for state management with the following slices:
- User authentication
- Theme preferences
- Portal management
- Incident tracking
- Notifications
- Command palette

## Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

The build output will be in the `dist` directory.

## License

Private - Internal Use Only