/**
 * Header component with search, theme toggle, notifications, and user menu
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  Home,
  Layout,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  User,
  Users,
  Database,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { toast } from 'sonner';
import { testApiConnection } from '@/lib/api/client';
import { env } from '@/config/env';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { dataSourceMode, apiConnected, setApiConnected } = useAppConfigStore();
  const [searchValue, setSearchValue] = useState('');
      const [isChecking, setIsChecking] = useState(false);

  // Check API connection on mount and when mode changes
  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        const apiUrl = dataSourceMode === 'mock' ? env.api.mockUrl : env.api.baseUrl;
        const isConnected = await testApiConnection(apiUrl);
        setApiConnected(isConnected);
      } catch (error) {
        setApiConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [dataSourceMode]);

  // Handle global search shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    // Emit search event or update global state
    // This will be connected to global state management later
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-full items-center px-4 gap-4">
        {/* Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Command className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Central Command
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="global-search"
              type="search"
              placeholder="Search portals..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "pl-10 pr-20 h-10 bg-muted/50 border-muted-foreground/20",
                "focus:bg-background focus:border-primary",
                "transition-all duration-200"
              )}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Data Source Switch with Connection Status */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="data-source-switch" className="text-xs font-medium text-muted-foreground">
                Mock
              </Label>
            </div>

            <Switch
              id="data-source-switch"
              checked={dataSourceMode === 'real'}
              onCheckedChange={(checked) => {
                const newMode = checked ? 'real' : 'mock';
                useAppConfigStore.getState().setDataSourceMode(newMode);
                toast.success(`Switched to ${newMode === 'mock' ? 'Mock Data' : 'Real API'}`, {
                  description: newMode === 'mock'
                    ? 'Using Mock API on port 5001'
                    : 'Using Real API on port 5000'
                });
              }}
              className="data-[state=checked]:bg-primary"
            />

            <div className="flex items-center gap-2">
              <Label htmlFor="data-source-switch" className="text-xs font-medium text-muted-foreground">
                Real
              </Label>
              <Server className="h-4 w-4 text-muted-foreground" />
              {isChecking ? (
                <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
              ) : apiConnected ? (
                <Wifi className="h-3 w-3 text-green-500" title="Connected" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" title="Disconnected" />
              )}
            </div>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-accent"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">System Alert</span>
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Documentation Portal is experiencing an outage
                </span>
                <span className="text-xs text-muted-foreground">10 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Performance Warning</span>
                  <Badge variant="secondary" className="text-xs">Warning</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Customer Service Hub response time degraded
                </span>
                <span className="text-xs text-muted-foreground">25 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Maintenance Complete</span>
                  <Badge className="text-xs">Info</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Inventory Management maintenance completed
                </span>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center w-full">
                View All Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium">John Doe</span>
                <ChevronDown className="hidden md:block h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>John Doe</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    john.doe@company.com
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Header;
