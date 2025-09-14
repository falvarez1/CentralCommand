import { useEffect, useRef, useState, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useNotificationContext } from '@/components/notifications/NotificationProvider'
import { Portal } from '@/types/portal.types'
import { Incident } from '@/types/incident.types'

export interface SignalROptions {
  url?: string
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onPortalUpdate?: (portalId: string, data: Partial<Portal>) => void
  onIncidentCreated?: (incident: Incident) => void
  onIncidentUpdated?: (incident: Incident) => void
  onMetricsUpdate?: (metrics: any) => void
  onSystemAlert?: (alert: any) => void
  onConnectionStateChange?: (state: signalR.HubConnectionState) => void
}

export interface SignalRHookReturn {
  connection: signalR.HubConnection | null
  isConnected: boolean
  connectionStatus: string
  reconnectAttempts: number
  lastError: Error | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  send: (methodName: string, ...args: any[]) => Promise<void>
  invoke: (methodName: string, ...args: any[]) => Promise<any>
}

const DEFAULT_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/hubs/central`
  : 'http://localhost:5142/hubs/central'

export const useSignalREnhanced = (options: SignalROptions = {}): SignalRHookReturn => {
  const {
    url = DEFAULT_URL,
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onPortalUpdate,
    onIncidentCreated,
    onIncidentUpdated,
    onMetricsUpdate,
    onSystemAlert,
    onConnectionStateChange
  } = options

  const queryClient = useQueryClient()
  const { showInfo, showWarning, showError } = useNotificationContext()

  const [connection, setConnection] = useState<signalR.HubConnection | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastError, setLastError] = useState<Error | null>(null)

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const isReconnectingRef = useRef(false)

  // Initialize SignalR connection
  const initializeConnection = useCallback(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(url, {
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
        skipNegotiation: false,
        withCredentials: true
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= maxReconnectAttempts) {
            return null // Stop reconnecting
          }
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          return Math.min(2000 * Math.pow(2, retryContext.previousRetryCount), 32000)
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build()

    // Connection state handlers
    newConnection.onreconnecting((error) => {
      setConnectionStatus('reconnecting')
      setIsConnected(false)
      isReconnectingRef.current = true
      showWarning('Connection Lost', 'Attempting to reconnect...')
      console.log('SignalR reconnecting:', error)
    })

    newConnection.onreconnected((connectionId) => {
      setConnectionStatus('connected')
      setIsConnected(true)
      setReconnectAttempts(0)
      isReconnectingRef.current = false
      showInfo('Connection Restored', 'Real-time updates resumed')
      console.log('SignalR reconnected:', connectionId)

      // Re-subscribe to groups or refresh data as needed
      queryClient.invalidateQueries({ queryKey: ['portals'] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    })

    newConnection.onclose((error) => {
      setConnectionStatus('disconnected')
      setIsConnected(false)
      if (error) {
        setLastError(error)
        showError('Connection Failed', 'Real-time updates unavailable')
        console.error('SignalR connection closed with error:', error)
        attemptReconnect()
      }
    })

    // Register event handlers
    newConnection.on('PortalUpdated', (portalId: string, data: Partial<Portal>) => {
      console.log('Portal updated:', portalId, data)

      // Update cache
      queryClient.setQueryData(['portals'], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          data: oldData.data.map((p: Portal) =>
            p.id === portalId ? { ...p, ...data } : p
          )
        }
      })

      // Update specific portal query
      queryClient.setQueryData(['portals', 'detail', portalId], (oldData: any) => {
        if (!oldData) return oldData
        return { ...oldData, ...data }
      })

      onPortalUpdate?.(portalId, data)
    })

    newConnection.on('IncidentCreated', (incident: Incident) => {
      console.log('Incident created:', incident)

      // Invalidate incident queries
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'stats'] })

      onIncidentCreated?.(incident)
    })

    newConnection.on('IncidentUpdated', (incident: Incident) => {
      console.log('Incident updated:', incident)

      // Update incident in cache
      queryClient.setQueryData(['incidents', 'detail', incident.id], incident)
      queryClient.invalidateQueries({ queryKey: ['incidents', 'list'] })

      onIncidentUpdated?.(incident)
    })

    newConnection.on('MetricsUpdated', (metrics: any) => {
      console.log('Metrics updated:', metrics)

      // Update dashboard stats
      queryClient.setQueryData(['statistics', 'dashboard'], metrics)
      queryClient.invalidateQueries({ queryKey: ['statistics', 'sparkline'] })

      onMetricsUpdate?.(metrics)
    })

    newConnection.on('SystemAlert', (alert: any) => {
      console.log('System alert:', alert)

      // Show notification based on alert severity
      switch (alert.severity) {
        case 'critical':
          showError(alert.title, alert.message)
          break
        case 'warning':
          showWarning(alert.title, alert.message)
          break
        default:
          showInfo(alert.title, alert.message)
      }

      onSystemAlert?.(alert)
    })

    // Heartbeat to keep connection alive
    newConnection.on('Heartbeat', () => {
      console.log('SignalR heartbeat received')
    })

    setConnection(newConnection)
    return newConnection
  }, [url, maxReconnectAttempts, queryClient, showInfo, showWarning, showError,
      onPortalUpdate, onIncidentCreated, onIncidentUpdated, onMetricsUpdate, onSystemAlert])

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    if (isReconnectingRef.current || reconnectAttempts >= maxReconnectAttempts) {
      return
    }

    isReconnectingRef.current = true
    setReconnectAttempts(prev => prev + 1)

    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        const newConnection = initializeConnection()
        await newConnection.start()
        setIsConnected(true)
        setConnectionStatus('connected')
        setReconnectAttempts(0)
        isReconnectingRef.current = false
        showInfo('Reconnected', 'Real-time updates restored')
      } catch (error) {
        console.error('Reconnection attempt failed:', error)
        isReconnectingRef.current = false
        attemptReconnect()
      }
    }, reconnectInterval * Math.pow(2, reconnectAttempts))
  }, [reconnectAttempts, maxReconnectAttempts, reconnectInterval, initializeConnection, showInfo])

  // Connect to SignalR
  const connect = useCallback(async () => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      return
    }

    try {
      setConnectionStatus('connecting')
      const conn = connection || initializeConnection()

      await conn.start()
      setIsConnected(true)
      setConnectionStatus('connected')
      setReconnectAttempts(0)

      console.log('SignalR connected successfully')

      // Subscribe to relevant groups
      await conn.invoke('JoinGroup', 'portals')
      await conn.invoke('JoinGroup', 'incidents')
      await conn.invoke('JoinGroup', 'metrics')

    } catch (error) {
      console.error('SignalR connection failed:', error)
      setLastError(error as Error)
      setConnectionStatus('disconnected')
      setIsConnected(false)
      attemptReconnect()
    }
  }, [connection, initializeConnection, attemptReconnect])

  // Disconnect from SignalR
  const disconnect = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (connection) {
      try {
        // Leave groups before disconnecting
        if (connection.state === signalR.HubConnectionState.Connected) {
          await connection.invoke('LeaveGroup', 'portals')
          await connection.invoke('LeaveGroup', 'incidents')
          await connection.invoke('LeaveGroup', 'metrics')
        }

        await connection.stop()
        setIsConnected(false)
        setConnectionStatus('disconnected')
        console.log('SignalR disconnected')
      } catch (error) {
        console.error('Error disconnecting SignalR:', error)
      }
    }
  }, [connection])

  // Send a message without expecting a response
  const send = useCallback(async (methodName: string, ...args: any[]) => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR is not connected')
    }

    await connection.send(methodName, ...args)
  }, [connection])

  // Invoke a method and get a response
  const invoke = useCallback(async (methodName: string, ...args: any[]) => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR is not connected')
    }

    return await connection.invoke(methodName, ...args)
  }, [connection])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (autoConnect) {
        disconnect()
      }
    }
  }, []) // Only run on mount/unmount

  // Handle connection state changes
  useEffect(() => {
    if (connection) {
      const state = connection.state
      onConnectionStateChange?.(state)

      switch (state) {
        case signalR.HubConnectionState.Connected:
          setConnectionStatus('connected')
          setIsConnected(true)
          break
        case signalR.HubConnectionState.Connecting:
          setConnectionStatus('connecting')
          setIsConnected(false)
          break
        case signalR.HubConnectionState.Reconnecting:
          setConnectionStatus('reconnecting')
          setIsConnected(false)
          break
        case signalR.HubConnectionState.Disconnected:
          setConnectionStatus('disconnected')
          setIsConnected(false)
          break
        case signalR.HubConnectionState.Disconnecting:
          setConnectionStatus('disconnecting')
          setIsConnected(false)
          break
      }
    }
  }, [connection?.state, onConnectionStateChange])

  return {
    connection,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    lastError,
    connect,
    disconnect,
    send,
    invoke
  }
}