import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { NotificationProvider } from '@/components/notifications/NotificationProvider'
import { CommandPaletteProvider } from '@/components/command-palette/CommandPaletteProvider'
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardPage } from '@/pages/DashboardPage'
import { PortalDetailsPage } from '@/pages/PortalDetailsPage'
import { IncidentsPage } from '@/pages/IncidentsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { useSignalR } from '@/hooks/useSignalR'
import { usePortalStore } from '@/stores/usePortalStore'
import { useIncidentStore } from '@/stores/useIncidentStore'
import { env } from '@/config/env'

// Initialize app with SignalR and API connections
function AppInitializer({ children }: { children: React.ReactNode }) {
  // Initialize stores with mock data
  const initializePortals = usePortalStore(state => state.initialize)
  const initializeIncidents = useIncidentStore(state => state.initialize)

  // Initialize SignalR connection for real-time updates
  const { isConnected } = useSignalR({
    autoConnect: env.features.enableRealtimeUpdates,
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
    // Initialize stores on mount
    initializePortals()
    initializeIncidents()

    // Log connection status in development
    if (import.meta.env.DEV) {
      console.log('Stores initialized');
      console.log('SignalR connected:', isConnected);
    }
  }, [])

  return <>{children}</>
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="central-command-theme">
        <NotificationProvider
          position="top-right"
          maxNotifications={5}
          soundEnabled={false}
          browserNotificationsEnabled={false}
        >
          <CommandPaletteProvider>
            <BrowserRouter>
              <AuthProvider>
                <AppInitializer>
                  <Routes>
                    {/* Public Auth Routes */}
                    <Route path="/auth/login" element={<LoginPage />} />
                    <Route path="/auth/register" element={<RegisterPage />} />
                    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected Routes */}
                    <Route
                      path="/"
                      element={
                        <AuthGuard>
                          <DashboardPage />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/portal/:id"
                      element={
                        <AuthGuard>
                          <PortalDetailsPage />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/incidents"
                      element={
                        <AuthGuard>
                          <IncidentsPage />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <AuthGuard>
                          <SettingsPage />
                        </AuthGuard>
                      }
                    />

                    {/* Redirects */}
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                    <Route path="/register" element={<Navigate to="/auth/register" replace />} />

                    {/* 404 Page */}
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </AppInitializer>
              </AuthProvider>
            </BrowserRouter>
          </CommandPaletteProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
