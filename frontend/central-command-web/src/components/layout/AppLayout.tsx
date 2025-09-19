/**
 * Main application layout wrapper
 * Provides the overall structure with header, sidebar, and main content area
 */

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Header from './Header';
import { Sidebar } from './Sidebar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { usePortalStore } from '@/stores/usePortalStore';
import { Portal } from '@/types';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { portals } = usePortalStore();

  // Get only favorited portals
  const favorites = portals.filter(p => p.isFavorite);

  // Auto-hide sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        onMenuClick={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex h-[calc(100vh-64px)] pt-16">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onClose={() => setIsSidebarOpen(false)}
          favorites={favorites}
          isMobile={isMobile}
        />

        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            isSidebarOpen && !isMobile && (isSidebarCollapsed ? "ml-16" : "ml-64"),
            "bg-gradient-to-br from-background via-background to-muted/20"
          )}
        >
          <div className="container mx-auto p-6 max-w-7xl">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};