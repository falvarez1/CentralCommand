/**
 * Session Timeout Modal Component
 * Displays warning when session is about to expire
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { sessionManager } from '@/lib/cookies';
import { toast } from 'sonner';

interface SessionTimeoutModalProps {
  warningTime?: number; // Time before expiry to show warning (ms)
  onExtend?: () => void;
  onLogout?: () => void;
}

export function SessionTimeoutModal({
  warningTime = sessionManager.warningTime,
  onExtend,
  onLogout
}: SessionTimeoutModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated, logout, refreshSession, getTimeUntilExpiry } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  // Check if session is expiring soon
  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
      return;
    }

    const checkSession = () => {
      const timeUntilExpiry = getTimeUntilExpiry();

      if (timeUntilExpiry > 0 && timeUntilExpiry <= warningTime) {
        setTimeRemaining(timeUntilExpiry);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Check immediately
    checkSession();

    // Check every 10 seconds
    const interval = setInterval(checkSession, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getTimeUntilExpiry, warningTime]);

  // Update countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const timeUntilExpiry = getTimeUntilExpiry();

      if (timeUntilExpiry <= 0) {
        setIsOpen(false);
        handleTimeout();
      } else {
        setTimeRemaining(timeUntilExpiry);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, getTimeUntilExpiry]);

  const handleTimeout = useCallback(async () => {
    toast.error('Session Expired', {
      description: 'Your session has expired. Please sign in again.',
      duration: 5000,
    });

    await logout();
    navigate('/auth/login', { state: { sessionExpired: true } });
  }, [logout, navigate]);

  const handleExtend = useCallback(async () => {
    setIsExtending(true);

    try {
      await refreshSession();
      setIsOpen(false);
      toast.success('Session Extended', {
        description: 'Your session has been extended successfully.',
        duration: 3000,
      });
      onExtend?.();
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast.error('Failed to Extend Session', {
        description: 'Unable to extend your session. Please sign in again.',
      });
      handleTimeout();
    } finally {
      setIsExtending(false);
    }
  }, [refreshSession, onExtend, handleTimeout]);

  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    await logout();
    onLogout?.();
    navigate('/auth/login');
  }, [logout, navigate, onLogout]);

  // Format time for display
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  // Calculate progress percentage
  const progressPercentage = (timeRemaining / warningTime) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <DialogTitle>Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Your session will expire in {formatTime(timeRemaining)}.
            Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Countdown Timer */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <Clock className="h-16 w-16 text-muted-foreground" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Time remaining</span>
              <span>{Math.ceil(progressPercentage)}%</span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2"
            />
          </div>

          {/* Warning Message */}
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="text-muted-foreground">
              For security reasons, you'll be automatically signed out when your session expires.
              Any unsaved work may be lost.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isExtending}
          >
            Sign Out
          </Button>
          <Button
            onClick={handleExtend}
            disabled={isExtending}
            className="min-w-[120px]"
          >
            {isExtending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Extend Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}