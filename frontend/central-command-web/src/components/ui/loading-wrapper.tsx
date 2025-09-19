/**
 * Loading wrapper component for async operations
 * Provides consistent loading, error, and empty states
 */

import React from 'react';
import { Loader2, AlertCircle, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingWrapperProps {
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyIcon?: React.ElementType;
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
  loadingMessage?: string;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data found',
  emptyTitle = 'No Results',
  emptyIcon: EmptyIcon = Database,
  onRetry,
  onAction,
  actionLabel = 'Take Action',
  children,
  className,
  loadingMessage = 'Loading...'
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{error}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-3"
              >
                Try Again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <EmptyIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {emptyMessage}
        </p>
        {onAction && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  // Content
  return <>{children}</>;
};

// Skeleton loader for individual items
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="bg-muted rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-muted-foreground/20 rounded" />
        <div className="h-8 w-8 bg-muted-foreground/20 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted-foreground/20 rounded" />
        <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-6 w-16 bg-muted-foreground/20 rounded-full" />
        <div className="h-6 w-20 bg-muted-foreground/20 rounded-full" />
      </div>
    </div>
  </div>
);

// Grid skeleton loader
export const SkeletonGrid: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className
}) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// List skeleton loader
export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-muted-foreground/20 rounded-full" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted-foreground/20 rounded" />
              <div className="h-4 w-48 bg-muted-foreground/20 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-muted-foreground/20 rounded-full" />
            <div className="h-8 w-8 bg-muted-foreground/20 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);