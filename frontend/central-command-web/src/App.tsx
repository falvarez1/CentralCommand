import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { NotificationProvider } from '@/components/notifications/NotificationProvider'
import { CommandPaletteProvider } from '@/components/command-palette/CommandPaletteProvider'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary'
import { DashboardPage } from '@/pages/DashboardPage'
import { PortalDetailsPage } from '@/pages/PortalDetailsPage'
import { IncidentsPage } from '@/pages/IncidentsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useSignalR } from '@/hooks/useSignalR'

// Initialize app with SignalR and API connections
function AppInitializer({ children }: { children: React.ReactNode }) {
  // Stores will be initialized by hooks when components mount

  // Initialize SignalR connection for real-time updates
  const { isConnected } = useSignalR({
    autoConnect: true,
    onMetricUpdate: (update) => {
      console.log('Metric update received:', update);
    },
    onIncidentUpdate: (update) => {
      console.log('Incident update received:', update);
    },
    onSystemHealthUpdate: (update) => {
      console.log('System health update received:', update);
    },
  });

  useEffect(() => {
    // Log connection status in development
    if (import.meta.env.DEV) {
      console.log('App initialized');
      console.log('SignalR connected:', isConnected);
    }
  }, [isConnected])

  return <>{children}</>
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="central-command-theme">
        <ServiceProvider>
          <NotificationProvider
            position="top-right"
            maxNotifications={5}
            soundEnabled={false}
            browserNotificationsEnabled={false}
          >
            <CommandPaletteProvider>
              <BrowserRouter>
                <AppInitializer>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/portal/:id" element={<PortalDetailsPage />} />
                    <Route path="/incidents" element={<IncidentsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </AppInitializer>
              </BrowserRouter>
            </CommandPaletteProvider>
          </NotificationProvider>
        </ServiceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
