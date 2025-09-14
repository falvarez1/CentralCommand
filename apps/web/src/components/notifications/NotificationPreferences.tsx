import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Mail,
  Smartphone,
  MessageSquare,
  Moon,
  Sun,
  Clock,
  Filter,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { useNotificationPreferences, useBrowserNotifications } from '../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../types/notification.types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface NotificationPreferencesProps {
  onSave?: () => void;
  onCancel?: () => void;
}

const notificationTypes = [
  {
    type: NotificationType.SUCCESS,
    label: 'Success',
    description: 'Successful operations and completions',
    icon: CheckCircle2,
    color: 'text-green-500'
  },
  {
    type: NotificationType.ERROR,
    label: 'Errors',
    description: 'Critical errors and failures',
    icon: AlertCircle,
    color: 'text-red-500'
  },
  {
    type: NotificationType.WARNING,
    label: 'Warnings',
    description: 'Important warnings and alerts',
    icon: AlertTriangle,
    color: 'text-yellow-500'
  },
  {
    type: NotificationType.INFO,
    label: 'Information',
    description: 'General information and updates',
    icon: Info,
    color: 'text-blue-500'
  }
];

const priorities = [
  { value: NotificationPriority.LOW, label: 'Low', description: 'Non-critical updates' },
  { value: NotificationPriority.MEDIUM, label: 'Medium', description: 'Standard notifications' },
  { value: NotificationPriority.HIGH, label: 'High', description: 'Important alerts' },
  { value: NotificationPriority.URGENT, label: 'Urgent', description: 'Critical issues requiring immediate attention' }
];

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  onSave,
  onCancel
}) => {
  const {
    emailEnabled,
    pushEnabled,
    soundEnabled,
    toggleEmail,
    togglePush,
    toggleSound
  } = useNotificationPreferences();

  const {
    isSupported: browserNotificationsSupported,
    permission: browserPermission,
    requestPermission
  } = useBrowserNotifications();

  // Local state for preferences
  const [preferences, setPreferences] = useState({
    // Channels
    channels: {
      inApp: true,
      email: emailEnabled,
      push: pushEnabled,
      slack: false,
      teams: false
    },
    // Types
    types: {
      [NotificationType.SUCCESS]: true,
      [NotificationType.ERROR]: true,
      [NotificationType.WARNING]: true,
      [NotificationType.INFO]: true
    },
    // Sound
    soundEnabled: soundEnabled,
    soundVolume: 50,
    // Duration
    notificationDuration: 5000,
    // Priority threshold
    minimumPriority: NotificationPriority.LOW,
    // Quiet hours
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    // Batching
    batching: {
      enabled: false,
      interval: 60 // minutes
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    setHasChanges(
      preferences.channels.email !== emailEnabled ||
      preferences.channels.push !== pushEnabled ||
      preferences.soundEnabled !== soundEnabled
    );
  }, [preferences, emailEnabled, pushEnabled, soundEnabled]);

  const handleChannelToggle = (channel: keyof typeof preferences.channels) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel]
      }
    }));
  };

  const handleTypeToggle = (type: NotificationType) => {
    setPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type]
      }
    }));
  };

  const handleSave = () => {
    // Update global preferences
    if (preferences.channels.email !== emailEnabled) toggleEmail();
    if (preferences.channels.push !== pushEnabled) togglePush();
    if (preferences.soundEnabled !== soundEnabled) toggleSound();

    // Save to localStorage for persistence
    localStorage.setItem('notification-preferences', JSON.stringify(preferences));

    toast.success('Preferences saved', {
      description: 'Your notification preferences have been updated.'
    });

    setHasChanges(false);
    onSave?.();
  };

  const handleReset = () => {
    const defaultPrefs = {
      channels: {
        inApp: true,
        email: true,
        push: false,
        slack: false,
        teams: false
      },
      types: {
        [NotificationType.SUCCESS]: true,
        [NotificationType.ERROR]: true,
        [NotificationType.WARNING]: true,
        [NotificationType.INFO]: true
      },
      soundEnabled: true,
      soundVolume: 50,
      notificationDuration: 5000,
      minimumPriority: NotificationPriority.LOW,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      batching: {
        enabled: false,
        interval: 60
      }
    };

    setPreferences(defaultPrefs);
    toast.info('Preferences reset', {
      description: 'All preferences have been reset to defaults.'
    });
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Permission granted', {
        description: 'You will now receive browser notifications.'
      });
      setPreferences(prev => ({
        ...prev,
        channels: {
          ...prev.channels,
          push: true
        }
      }));
    } else {
      toast.error('Permission denied', {
        description: 'Browser notifications have been blocked.'
      });
    }
  };

  const testNotification = (type: NotificationType) => {
    const messages = {
      [NotificationType.SUCCESS]: 'This is a test success notification',
      [NotificationType.ERROR]: 'This is a test error notification',
      [NotificationType.WARNING]: 'This is a test warning notification',
      [NotificationType.INFO]: 'This is a test info notification'
    };

    switch (type) {
      case NotificationType.SUCCESS:
        toast.success('Test Notification', { description: messages[type] });
        break;
      case NotificationType.ERROR:
        toast.error('Test Notification', { description: messages[type] });
        break;
      case NotificationType.WARNING:
        toast.warning('Test Notification', { description: messages[type] });
        break;
      case NotificationType.INFO:
        toast.info('Test Notification', { description: messages[type] });
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Notification Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize how and when you receive notifications
        </p>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* In-App Notifications */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="in-app" className="text-base font-medium">
                      In-App Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Show notifications within the application
                    </p>
                  </div>
                </div>
                <Switch
                  id="in-app"
                  checked={preferences.channels.inApp}
                  onCheckedChange={() => handleChannelToggle('inApp')}
                />
              </div>

              <Separator />

              {/* Browser Notifications */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="push" className="text-base font-medium">
                      Browser Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications even when the app is in background
                    </p>
                    {browserNotificationsSupported && (
                      <Badge
                        variant={browserPermission === 'granted' ? 'success' : 'secondary'}
                        className="mt-1"
                      >
                        {browserPermission === 'granted' ? 'Enabled' :
                         browserPermission === 'denied' ? 'Blocked' : 'Not configured'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {browserPermission !== 'granted' && browserNotificationsSupported && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestPermission}
                    >
                      Enable
                    </Button>
                  )}
                  <Switch
                    id="push"
                    checked={preferences.channels.push}
                    onCheckedChange={() => handleChannelToggle('push')}
                    disabled={!browserNotificationsSupported || browserPermission !== 'granted'}
                  />
                </div>
              </div>

              <Separator />

              {/* Email Notifications */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="email" className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive important notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email"
                  checked={preferences.channels.email}
                  onCheckedChange={() => handleChannelToggle('email')}
                />
              </div>

              <Separator />

              {/* Slack Integration */}
              <div className="flex items-center justify-between py-3 opacity-50">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="slack" className="text-base font-medium">
                      Slack Integration
                    </Label>
                    <p className="text-sm text-gray-500">
                      Send notifications to your Slack workspace
                    </p>
                    <Badge variant="outline" className="mt-1">Coming Soon</Badge>
                  </div>
                </div>
                <Switch
                  id="slack"
                  checked={preferences.channels.slack}
                  onCheckedChange={() => handleChannelToggle('slack')}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((notifType) => {
                const Icon = notifType.icon;
                return (
                  <div key={notifType.type} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Icon className={cn('h-5 w-5', notifType.color)} />
                      <div>
                        <Label className="text-base font-medium">
                          {notifType.label}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {notifType.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testNotification(notifType.type)}
                      >
                        Test
                      </Button>
                      <Switch
                        checked={preferences.types[notifType.type]}
                        onCheckedChange={() => handleTypeToggle(notifType.type)}
                      />
                    </div>
                  </div>
                );
              })}

              <Separator />

              {/* Minimum Priority */}
              <div className="py-3">
                <Label className="text-base font-medium">Minimum Priority Level</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Only show notifications with this priority or higher
                </p>
                <Select
                  value={preferences.minimumPriority}
                  onValueChange={(value) => setPreferences(prev => ({
                    ...prev,
                    minimumPriority: value as NotificationPriority
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div>
                          <div className="font-medium">{priority.label}</div>
                          <div className="text-xs text-gray-500">{priority.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sound Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Sound Settings</CardTitle>
              <CardDescription>
                Configure notification sounds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {preferences.soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-gray-500" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <Label className="text-base font-medium">
                      Notification Sounds
                    </Label>
                    <p className="text-sm text-gray-500">
                      Play sounds when notifications arrive
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.soundEnabled}
                  onCheckedChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    soundEnabled: checked
                  }))}
                />
              </div>

              {preferences.soundEnabled && (
                <div className="pt-2">
                  <Label className="text-sm">Volume</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <VolumeX className="h-4 w-4 text-gray-400" />
                    <Slider
                      value={[preferences.soundVolume]}
                      onValueChange={([value]) => setPreferences(prev => ({
                        ...prev,
                        soundVolume: value
                      }))}
                      max={100}
                      step={10}
                      className="flex-1"
                    />
                    <Volume2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium w-10 text-right">
                      {preferences.soundVolume}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Duration</CardTitle>
              <CardDescription>
                How long notifications should be displayed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Auto-dismiss after</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Slider
                      value={[preferences.notificationDuration / 1000]}
                      onValueChange={([value]) => setPreferences(prev => ({
                        ...prev,
                        notificationDuration: value * 1000
                      }))}
                      min={2}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-20 text-right">
                      {preferences.notificationDuration / 1000} seconds
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                Silence non-critical notifications during specific times
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-base font-medium">
                      Enable Quiet Hours
                    </Label>
                    <p className="text-sm text-gray-500">
                      Only urgent notifications will be shown
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    quietHours: {
                      ...prev.quietHours,
                      enabled: checked
                    }
                  }))}
                />
              </div>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label htmlFor="quiet-start" className="text-sm">Start Time</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        quietHours: {
                          ...prev.quietHours,
                          start: e.target.value
                        }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end" className="text-sm">End Time</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        quietHours: {
                          ...prev.quietHours,
                          end: e.target.value
                        }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Batching</CardTitle>
              <CardDescription>
                Group multiple notifications together to reduce interruptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-base font-medium">
                      Enable Batching
                    </Label>
                    <p className="text-sm text-gray-500">
                      Combine similar notifications into digests
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.batching.enabled}
                  onCheckedChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    batching: {
                      ...prev.batching,
                      enabled: checked
                    }
                  }))}
                />
              </div>

              {preferences.batching.enabled && (
                <div className="pt-2">
                  <Label className="text-sm">Batch Interval</Label>
                  <Select
                    value={preferences.batching.interval.toString()}
                    onValueChange={(value) => setPreferences(prev => ({
                      ...prev,
                      batching: {
                        ...prev.batching,
                        interval: parseInt(value)
                      }
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="120">Every 2 hours</SelectItem>
                      <SelectItem value="240">Every 4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t">
        <Button
          variant="ghost"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

// Usage example in comments:
/*
// In a modal or settings page:
import { NotificationPreferences } from './components/notifications/NotificationPreferences';

function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalContent className="max-w-4xl">
        <NotificationPreferences
          onSave={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </ModalContent>
    </Modal>
  );
}
*/