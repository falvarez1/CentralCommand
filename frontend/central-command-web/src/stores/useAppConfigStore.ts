import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { env } from '../config/env';

export type DataSourceMode = 'mock' | 'real';

interface AppConfigState {
  // Data source configuration
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;
  toggleDataSourceMode: () => void;

  // View preferences
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Feature flags
  enableRealtimeUpdates: boolean;
  enableErrorReporting: boolean;
  setEnableRealtimeUpdates: (enabled: boolean) => void;
  setEnableErrorReporting: (enabled: boolean) => void;

  // API connection status
  apiConnected: boolean;
  apiLastChecked: Date | null;
  setApiConnected: (connected: boolean) => void;

  // Helpers
  isUsingMockData: () => boolean;
  isUsingRealApi: () => boolean;
}

export const useAppConfigStore = create<AppConfigState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initialize with environment config or defaults
        dataSourceMode: env.api.enableMock ? 'mock' : 'real',
        viewMode: 'grid',
        enableRealtimeUpdates: env.features.enableRealtimeUpdates,
        enableErrorReporting: env.features.enableErrorReporting,
        apiConnected: false,
        apiLastChecked: null,

        setDataSourceMode: (mode) => set((state) => {
          state.dataSourceMode = mode;
          // Reset API connection status when switching modes
          if (mode === 'mock') {
            state.apiConnected = false;
            state.apiLastChecked = null;
          }
        }),

        toggleDataSourceMode: () => set((state) => {
          state.dataSourceMode = state.dataSourceMode === 'mock' ? 'real' : 'mock';
          // Reset API connection status when switching to mock
          if (state.dataSourceMode === 'mock') {
            state.apiConnected = false;
            state.apiLastChecked = null;
          }
        }),

        setViewMode: (mode) => set((state) => {
          state.viewMode = mode;
        }),

        setEnableRealtimeUpdates: (enabled) => set((state) => {
          state.enableRealtimeUpdates = enabled;
        }),

        setEnableErrorReporting: (enabled) => set((state) => {
          state.enableErrorReporting = enabled;
        }),

        setApiConnected: (connected) => set((state) => {
          state.apiConnected = connected;
          state.apiLastChecked = new Date();
        }),

        // Helper methods
        isUsingMockData: () => get().dataSourceMode === 'mock',
        isUsingRealApi: () => get().dataSourceMode === 'real',
      })),
      {
        name: 'app-config',
        partialize: (state) => ({
          dataSourceMode: state.dataSourceMode,
          viewMode: state.viewMode,
          enableRealtimeUpdates: state.enableRealtimeUpdates,
          enableErrorReporting: state.enableErrorReporting,
        }),
      }
    ),
    { name: 'AppConfig' }
  )
);