import React, { useState } from 'react';
import {

  Settings,
  Bell,
  Send,
  Rocket,
  AlertTriangle,
  Info,
  XCircle,
  Zap,
  GitBranch,
  Shield,
  Server,
  Activity,
  Package
} from 'lucide-react';
import { NotificationProvider, useNotificationContext } from './NotificationProvider';
import { NotificationCenter } from './NotificationCenter';
import { NotificationPreferences } from './NotificationPreferences';
import { notificationManager } from './NotificationContainer';
import { NotificationType, NotificationPriority } from '../../types/notification.types';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const NotificationDemoContent: React.FC = () => {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    requestBrowserPermission
  } = useNotificationContext();

  const [customNotification, setCustomNotification] = useState({
    type: NotificationType.INFO,
    priority: NotificationPriority.MEDIUM,
    title: 'Custom Notification',
    message: 'This is a custom notification message',
    duration: 5000
  });

  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // System notification examples
  const systemNotifications = [
    {
      icon: <Server className="h-5 w-5" />,
      title: 'Portal Status Change',
      message: 'API Gateway has changed from operational to degraded',
      type: NotificationType.WARNING,
      priority: NotificationPriority.HIGH,
      action: () => showWarning('Portal Status Change', 'API Gateway has changed from operational to degraded', {
        priority: NotificationPriority.HIGH,
        action: {
          label: 'View Portal',
          onClick: () => console.log('Viewing portal')
        }
      })
    },
    {
      icon: <Rocket className="h-5 w-5" />,
      title: 'Deployment Complete',
      message: 'Successfully deployed v2.4.1 to production',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.MEDIUM,
      action: () => showSuccess('Deployment Complete', 'Successfully deployed v2.4.1 to production', {
        action: {
          label: 'View Deployment',
          onClick: () => console.log('Viewing deployment')
        }
      })
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: 'Health Check Failed',
      message: 'Health check failed for Analytics Service',
      type: NotificationType.ERROR,
      priority: NotificationPriority.URGENT,
      action: () => showError('Health Check Failed', 'Health check failed for Analytics Service', {
        priority: NotificationPriority.URGENT,
        persistent: true,
        action: {
          label: 'Investigate',
          onClick: () => console.log('Investigating issue')
        }
      })
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: 'Scheduled Maintenance',
      message: 'Database maintenance scheduled for tonight at 2:00 AM',
      type: NotificationType.INFO,
      priority: NotificationPriority.LOW,
      action: () => showInfo('Scheduled Maintenance', 'Database maintenance scheduled for tonight at 2:00 AM')
    }
  ];

  // Incident notifications
  const incidentNotifications = [
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'New Critical Incident',
      message: 'Payment service experiencing high error rates',
      type: NotificationType.ERROR,
      priority: NotificationPriority.URGENT,
      action: () => showError('New Critical Incident', 'Payment service experiencing high error rates', {
        priority: NotificationPriority.URGENT,
        browserNotification: true,
        sound: true,
        action: {
          label: 'View Incident',
          onClick: () => console.log('Viewing incident')
        }
      })
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Incident Escalated',
      message: 'INC-2024-001 has been escalated to Level 2',
      type: NotificationType.WARNING,
      priority: NotificationPriority.HIGH,
      action: () => showWarning('Incident Escalated', 'INC-2024-001 has been escalated to Level 2', {
        priority: NotificationPriority.HIGH,
        action: {
          label: 'View Details',
          onClick: () => console.log('Viewing details')
        }
      })
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: 'Incident Resolved',
      message: 'INC-2024-002 has been successfully resolved',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.MEDIUM,
      action: () => showSuccess('Incident Resolved', 'INC-2024-002 has been successfully resolved')
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Team Assignment',
      message: 'You have been assigned to incident INC-2024-003',
      type: NotificationType.INFO,
      priority: NotificationPriority.MEDIUM,
      action: () => showInfo('Team Assignment', 'You have been assigned to incident INC-2024-003', {
        action: {
          label: 'View Assignment',
          onClick: () => console.log('Viewing assignment')
        }
      })
    }
  ];

  // User action notifications
  const userActionNotifications = [
    {
      icon: <Package className="h-5 w-5" />,
      title: 'Portal Added',
      message: 'New portal "Customer Service" has been added',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.LOW,
      action: () => showSuccess('Portal Added', 'New portal "Customer Service" has been added')
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: 'Settings Saved',
      message: 'Your preferences have been updated',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.LOW,
      action: () => showSuccess('Settings Saved', 'Your preferences have been updated')
    },
    {
      icon: <GitBranch className="h-5 w-5" />,
      title: 'Export Complete',
      message: 'System report has been exported successfully',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.LOW,
      action: () => showSuccess('Export Complete', 'System report has been exported successfully', {
        action: {
          label: 'Download',
          onClick: () => console.log('Downloading report')
        }
      })
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Bulk Operation Complete',
      message: 'Successfully updated 15 portals',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.MEDIUM,
      action: () => showSuccess('Bulk Operation Complete', 'Successfully updated 15 portals', {
        action: {
          label: 'View Changes',
          onClick: () => console.log('Viewing changes')
        }
      })
    }
  ];

  const triggerMultipleNotifications = () => {
    setTimeout(() => showInfo('First Notification', 'This is the first notification'), 0);
    setTimeout(() => showSuccess('Second Notification', 'This is the second notification'), 500);
    setTimeout(() => showWarning('Third Notification', 'This is the third notification'), 1000);
    setTimeout(() => showError('Fourth Notification', 'This is the fourth notification'), 1500);
    setTimeout(() => showInfo('Fifth Notification', 'This is the fifth notification'), 2000);
    setTimeout(() => showSuccess('Sixth Notification', 'This will be queued'), 2500);
    setTimeout(() => showWarning('Seventh Notification', 'This will also be queued'), 3000);
  };

  const sendCustomNotification = () => {
    showNotification({
      type: customNotification.type,
      title: customNotification.title,
      message: customNotification.message,
      priority: customNotification.priority,
      autoCloseDelay: customNotification.duration,
      actions: [{
        type: 'link' as any,
        label: 'Custom Action',
        url: '#'
      }]
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Notification System Demo
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Test and explore the comprehensive notification system
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => requestBrowserPermission()}
              >
                <Bell className="h-4 w-4 mr-2" />
                Enable Browser Notifications
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreferencesOpen(!preferencesOpen)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
              <NotificationCenter onOpenPreferences={() => setPreferencesOpen(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {preferencesOpen ? (
          <Card>
            <NotificationPreferences
              onSave={() => setPreferencesOpen(false)}
              onCancel={() => setPreferencesOpen(false)}
            />
          </Card>
        ) : (
          <Tabs defaultValue="system" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="incidents">Incidents</TabsTrigger>
              <TabsTrigger value="actions">User Actions</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            {/* System Notifications */}
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Notifications</CardTitle>
                  <CardDescription>
                    Portal status changes, deployments, health checks, and maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {systemNotifications.map((notification, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${
                            notification.type === NotificationType.SUCCESS ? 'text-green-500' :
                            notification.type === NotificationType.ERROR ? 'text-red-500' :
                            notification.type === NotificationType.WARNING ? 'text-yellow-500' :
                            'text-blue-500'
                          }`}>
                            {notification.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={
                                notification.priority === NotificationPriority.URGENT ? 'destructive' :
                                notification.priority === NotificationPriority.HIGH ? 'warning' :
                                notification.priority === NotificationPriority.MEDIUM ? 'default' :
                                'secondary'
                              }>
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline">
                                {notification.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={notification.action}
                          variant="outline"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Trigger
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <div className="flex items-center justify-center">
                    <Button onClick={triggerMultipleNotifications} variant="default">
                      <Zap className="h-4 w-4 mr-2" />
                      Trigger Multiple Notifications (Test Queue)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Incident Notifications */}
            <TabsContent value="incidents">
              <Card>
                <CardHeader>
                  <CardTitle>Incident Notifications</CardTitle>
                  <CardDescription>
                    New incidents, escalations, resolutions, and team assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {incidentNotifications.map((notification, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${
                            notification.type === NotificationType.SUCCESS ? 'text-green-500' :
                            notification.type === NotificationType.ERROR ? 'text-red-500' :
                            notification.type === NotificationType.WARNING ? 'text-yellow-500' :
                            'text-blue-500'
                          }`}>
                            {notification.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={
                                notification.priority === NotificationPriority.URGENT ? 'destructive' :
                                notification.priority === NotificationPriority.HIGH ? 'warning' :
                                notification.priority === NotificationPriority.MEDIUM ? 'default' :
                                'secondary'
                              }>
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline">
                                {notification.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={notification.action}
                          variant="outline"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Trigger
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Action Notifications */}
            <TabsContent value="actions">
              <Card>
                <CardHeader>
                  <CardTitle>User Action Notifications</CardTitle>
                  <CardDescription>
                    Portal management, settings, exports, and bulk operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {userActionNotifications.map((notification, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${
                            notification.type === NotificationType.SUCCESS ? 'text-green-500' :
                            notification.type === NotificationType.ERROR ? 'text-red-500' :
                            notification.type === NotificationType.WARNING ? 'text-yellow-500' :
                            'text-blue-500'
                          }`}>
                            {notification.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={
                                notification.priority === NotificationPriority.URGENT ? 'destructive' :
                                notification.priority === NotificationPriority.HIGH ? 'warning' :
                                notification.priority === NotificationPriority.MEDIUM ? 'default' :
                                'secondary'
                              }>
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline">
                                {notification.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={notification.action}
                          variant="outline"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Trigger
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom Notification Builder */}
            <TabsContent value="custom">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Notification Builder</CardTitle>
                  <CardDescription>
                    Create and test custom notifications with different settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="custom-type">Notification Type</Label>
                        <Select
                          value={customNotification.type}
                          onValueChange={(value) => setCustomNotification(prev => ({
                            ...prev,
                            type: value as NotificationType
                          }))}
                        >
                          <SelectTrigger id="custom-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NotificationType.SUCCESS}>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Success
                              </div>
                            </SelectItem>
                            <SelectItem value={NotificationType.ERROR}>
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                                Error
                              </div>
                            </SelectItem>
                            <SelectItem value={NotificationType.WARNING}>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                Warning
                              </div>
                            </SelectItem>
                            <SelectItem value={NotificationType.INFO}>
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                Info
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="custom-priority">Priority Level</Label>
                        <Select
                          value={customNotification.priority}
                          onValueChange={(value) => setCustomNotification(prev => ({
                            ...prev,
                            priority: value as NotificationPriority
                          }))}
                        >
                          <SelectTrigger id="custom-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NotificationPriority.LOW}>Low</SelectItem>
                            <SelectItem value={NotificationPriority.MEDIUM}>Medium</SelectItem>
                            <SelectItem value={NotificationPriority.HIGH}>High</SelectItem>
                            <SelectItem value={NotificationPriority.URGENT}>Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="custom-title">Title</Label>
                      <Input
                        id="custom-title"
                        value={customNotification.title}
                        onChange={(e) => setCustomNotification(prev => ({
                          ...prev,
                          title: e.target.value
                        }))}
                        placeholder="Enter notification title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-message">Message</Label>
                      <Textarea
                        id="custom-message"
                        value={customNotification.message}
                        onChange={(e) => setCustomNotification(prev => ({
                          ...prev,
                          message: e.target.value
                        }))}
                        placeholder="Enter notification message"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-duration">Duration (seconds)</Label>
                      <Input
                        id="custom-duration"
                        type="number"
                        value={customNotification.duration / 1000}
                        onChange={(e) => setCustomNotification(prev => ({
                          ...prev,
                          duration: parseInt(e.target.value) * 1000
                        }))}
                        min={1}
                        max={30}
                      />
                    </div>

                    <div className="flex items-center justify-center pt-4">
                      <Button onClick={sendCustomNotification} size="lg">
                        <Send className="h-4 w-4 mr-2" />
                        Send Custom Notification
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export const NotificationDemo: React.FC = () => {
  return (
    <NotificationProvider position="top-right" soundEnabled={true}>
      <NotificationDemoContent />
    </NotificationProvider>
  );
};

// Usage example in comments:
/*
// In your routes or App.tsx:
import { NotificationDemo } from './components/notifications/NotificationDemo';

// Add route
<Route path="/notifications-demo" element={<NotificationDemo />} />

// Or render directly
function App() {
  return <NotificationDemo />;
}
*/