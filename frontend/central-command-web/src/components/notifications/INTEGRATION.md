# Notification System Integration Guide

## Quick Start

### 1. Wrap Your App with NotificationProvider

In your main `App.tsx` or root component:

```tsx
import { NotificationProvider } from './components/notifications';

function App() {
  return (
    <NotificationProvider
      position="top-right"
      soundEnabled={true}
      maxNotifications={5}
    >
      {/* Your app content */}
      <YourAppContent />
    </NotificationProvider>
  );
}
```

### 2. Add NotificationCenter to Header

In your header component:

```tsx
import { NotificationCenter } from './components/notifications';

function Header() {
  return (
    <header>
      {/* Other header content */}
      <NotificationCenter
        onOpenPreferences={() => openSettingsModal()}
      />
    </header>
  );
}
```

### 3. Use Notifications in Components

```tsx
import { useNotificationContext } from './components/notifications';

function YourComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotificationContext();

  const handleAction = async () => {
    try {
      await doSomething();
      showSuccess('Success!', 'Operation completed successfully');
    } catch (error) {
      showError('Error!', 'Something went wrong', {
        priority: NotificationPriority.HIGH,
        action: {
          label: 'Retry',
          onClick: handleAction
        }
      });
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

## Advanced Usage

### Portal Status Monitoring

```tsx
import { useEffect } from 'react';
import { useNotificationContext } from './components/notifications';
import { usePortalStore } from '../stores/usePortalStore';

function PortalMonitor() {
  const { showWarning, showError } = useNotificationContext();
  const portals = usePortalStore(state => state.portals);

  useEffect(() => {
    portals.forEach(portal => {
      if (portal.status === 'outage') {
        showError(
          'Portal Outage',
          `${portal.name} is experiencing an outage`,
          {
            priority: NotificationPriority.URGENT,
            browserNotification: true,
            action: {
              label: 'View Portal',
              onClick: () => window.location.href = `/portals/${portal.id}`
            }
          }
        );
      } else if (portal.status === 'degraded') {
        showWarning(
          'Portal Degraded',
          `${portal.name} is experiencing degraded performance`
        );
      }
    });
  }, [portals, showWarning, showError]);

  return null;
}
```

### Incident Notifications

```tsx
import { useNotificationContext } from './components/notifications';
import { NotificationPriority } from './components/notifications';

function IncidentManager() {
  const { showNotification } = useNotificationContext();

  const createIncident = (incident: Incident) => {
    showNotification({
      type: incident.severity === 'critical'
        ? NotificationType.ERROR
        : NotificationType.WARNING,
      title: 'New Incident Created',
      message: incident.title,
      priority: incident.severity === 'critical'
        ? NotificationPriority.URGENT
        : NotificationPriority.HIGH,
      persistent: incident.severity === 'critical',
      browserNotification: true,
      actions: [
        {
          type: 'link',
          label: 'View Incident',
          url: `/incidents/${incident.id}`
        },
        {
          type: 'button',
          label: 'Assign to Me',
          onClick: () => assignIncidentToMe(incident.id)
        }
      ]
    });
  };

  return (
    // Your incident management UI
  );
}
```

### Deployment Notifications

```tsx
function DeploymentManager() {
  const { showSuccess, showError, showInfo } = useNotificationContext();

  const startDeployment = async (service: string) => {
    showInfo('Deployment Started', `Deploying ${service} to production...`, {
      persistent: true
    });

    try {
      await deployService(service);
      showSuccess('Deployment Complete', `${service} successfully deployed`, {
        action: {
          label: 'View Logs',
          onClick: () => openDeploymentLogs(service)
        }
      });
    } catch (error) {
      showError('Deployment Failed', `Failed to deploy ${service}`, {
        priority: NotificationPriority.HIGH,
        action: {
          label: 'Rollback',
          onClick: () => rollbackDeployment(service)
        }
      });
    }
  };

  return (
    // Your deployment UI
  );
}
```

### Bulk Operations

```tsx
function BulkOperations() {
  const { showSuccess, showWarning } = useNotificationContext();

  const performBulkUpdate = async (items: Item[]) => {
    const results = await updateItems(items);

    if (results.success.length === items.length) {
      showSuccess(
        'Bulk Update Complete',
        `Successfully updated ${results.success.length} items`
      );
    } else if (results.failed.length > 0) {
      showWarning(
        'Partial Success',
        `Updated ${results.success.length} items, ${results.failed.length} failed`,
        {
          action: {
            label: 'View Errors',
            onClick: () => showErrorDetails(results.failed)
          }
        }
      );
    }
  };

  return (
    // Your bulk operations UI
  );
}
```

## Integration with Existing Stores

### Update UI Store

If you have an existing UI store, integrate notification state:

```tsx
// In your useUIStore.ts
import { notificationManager } from '../components/notifications';

// Add to your store actions
showToast: (type, title, message, duration) => {
  // Use the notification manager
  notificationManager[type](title, message, { duration });
}
```

### Connect to WebSocket Events

```tsx
function WebSocketNotifications() {
  const { showNotification } = useNotificationContext();

  useEffect(() => {
    const ws = new WebSocket('ws://your-server');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'notification') {
        showNotification({
          type: data.notificationType,
          title: data.title,
          message: data.message,
          priority: data.priority,
          browserNotification: data.priority === 'urgent'
        });
      }
    };

    return () => ws.close();
  }, [showNotification]);

  return null;
}
```

## Customization

### Custom Notification Types

```tsx
// Define custom notification for specific events
function useCustomNotifications() {
  const { showNotification } = useNotificationContext();

  const showMaintenanceNotification = (startTime: Date, duration: number) => {
    showNotification({
      type: NotificationType.INFO,
      title: 'Scheduled Maintenance',
      message: `System maintenance will begin at ${startTime.toLocaleString()}`,
      priority: NotificationPriority.MEDIUM,
      persistent: true,
      actions: [
        {
          type: 'link',
          label: 'View Details',
          url: '/maintenance'
        },
        {
          type: 'button',
          label: 'Set Reminder',
          onClick: () => setMaintenanceReminder(startTime)
        }
      ]
    });
  };

  return { showMaintenanceNotification };
}
```

### Theme Integration

The notification system automatically respects your app's dark/light theme through Tailwind CSS classes. No additional configuration needed.

### Accessibility

The notification system includes:
- ARIA live regions for screen reader announcements
- Keyboard navigation support
- Focus management
- High contrast mode support
- Reduced motion support

## Testing

### Unit Testing

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { NotificationProvider, notificationManager } from './components/notifications';

test('shows success notification', async () => {
  render(
    <NotificationProvider>
      <div data-testid="app">App Content</div>
    </NotificationProvider>
  );

  notificationManager.success('Test', 'Test message');

  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
```

### E2E Testing

```tsx
// Cypress example
describe('Notifications', () => {
  it('shows notification on portal outage', () => {
    cy.visit('/');
    cy.mockPortalStatus('portal-1', 'outage');

    cy.get('[role="alert"]').should('contain', 'Portal Outage');
    cy.get('[aria-label="Notifications"]').click();
    cy.get('.notification-center').should('contain', 'portal-1');
  });
});
```

## Performance Considerations

1. **Notification Limits**: The system limits visible notifications to prevent UI clutter
2. **Queue Management**: Excess notifications are queued and shown as slots become available
3. **Memory Management**: Old notifications are automatically cleaned up from history
4. **Sound Caching**: Notification sounds are cached after first load
5. **Debouncing**: Rapid notifications are automatically debounced to prevent spam

## Browser Compatibility

- Chrome 88+ ✅
- Firefox 85+ ✅
- Safari 14+ ✅
- Edge 88+ ✅
- Mobile browsers ✅ (with limited browser notification support)

## Troubleshooting

### Sounds Not Playing
- Check that sound files exist in `/public/sounds/`
- Verify browser autoplay policies
- Check console for audio loading errors

### Browser Notifications Not Working
- Ensure HTTPS is enabled (required for notifications API)
- Check browser notification permissions
- Verify user has granted permission

### Notifications Not Appearing
- Check that NotificationProvider is wrapping your app
- Verify notification types are enabled in preferences
- Check browser console for errors

## Migration from Existing System

If migrating from an existing notification system:

1. Replace old toast/alert calls with new notification methods
2. Update notification state management
3. Migrate notification preferences
4. Update tests to use new notification API
5. Remove old notification dependencies

## Support

For issues or questions about the notification system:
1. Check the demo page at `/notifications-demo`
2. Review the component source code
3. Check browser console for errors
4. Verify all dependencies are installed