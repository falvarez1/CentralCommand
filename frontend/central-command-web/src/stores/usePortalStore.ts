import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable Immer MapSet plugin
enableMapSet();
import { v4 as uuidv4 } from 'uuid';
import {
  Portal,
  PortalStatus,
  PortalCategory,
  PortalFilter,
  CreatePortalInput,
  UpdatePortalInput,
  BulkOperation,
  BulkOperationType,
  PortalStats,
  PortalEnvironment,
  PortalPriority,
  AuthType
} from '../types/portal.types';

interface PortalState {
  // State
  portals: Portal[];
  filter: PortalFilter;
  selectedPortals: string[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  searchTerm: string;
  selectedCategory: string;

  // Actions
  setPortals: (portals: Portal[]) => void;
  addPortal: (portal: Portal) => void;
  updatePortal: (id: string, input: UpdatePortalInput) => void;
  deletePortal: (id: string) => void;
  deleteMultiplePortals: (ids: string[]) => void;

  // Filter actions
  setFilter: (filter: Partial<PortalFilter>) => void;
  clearFilter: () => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;

  // Favorite actions
  toggleFavorite: (id: string) => void;

  // Selection actions
  selectPortal: (id: string) => void;
  deselectPortal: (id: string) => void;
  selectAllPortals: () => void;
  clearSelection: () => void;

  // Bulk operations
  executeBulkOperation: (operation: BulkOperation) => void;


  // State management
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePortalStore = create<PortalState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        portals: [],
        filter: {},
        selectedPortals: [],
        isLoading: false,
        error: null,
        lastSync: null,
        searchTerm: '',
        selectedCategory: 'all',


        // Actions
        setPortals: (portals) => set(state => {
          state.portals = portals;
        }),

        addPortal: (portal: Portal) => set(state => {
          state.portals.push(portal);
        }),

        updatePortal: (id, input) => set(state => {
          const index = state.portals.findIndex((p: Portal) => p.id === id);
          if (index !== -1) {
            state.portals[index] = {
              ...state.portals[index],
              ...input,
              updatedAt: new Date(),
              updatedBy: uuidv4() // Would come from auth context
            };
          }
        }),

        deletePortal: (id) => set(state => {
          state.portals = state.portals.filter((p: Portal) => p.id !== id);
          state.selectedPortals = state.selectedPortals.filter((pid: string) => pid !== id);
        }),

        deleteMultiplePortals: (ids) => set(state => {
          state.portals = state.portals.filter((p: Portal) => !ids.includes(p.id));
          state.selectedPortals = state.selectedPortals.filter((pid: string) => !ids.includes(pid));
        }),

        setFilter: (filter) => set(state => {
          state.filter = { ...state.filter, ...filter };
        }),

        clearFilter: () => set(state => {
          state.filter = {};
          state.searchTerm = '';
          state.selectedCategory = 'all';
        }),

        setSearchTerm: (term) => set(state => {
          state.searchTerm = term;
        }),

        setSelectedCategory: (category) => set(state => {
          state.selectedCategory = category;
        }),

        toggleFavorite: (id) => set(state => {
          const portal = state.portals.find((p: Portal) => p.id === id);
          if (portal) {
            portal.isFavorite = !portal.isFavorite;
            portal.updatedAt = new Date();
          }
        }),

        selectPortal: (id) => set(state => {
          if (!state.selectedPortals.includes(id)) {
            state.selectedPortals.push(id);
          }
        }),

        deselectPortal: (id) => set(state => {
          state.selectedPortals = state.selectedPortals.filter((pid: string) => pid !== id);
        }),

        selectAllPortals: () => set(state => {
          state.selectedPortals = state.portals.map((p: Portal) => p.id);
        }),

        clearSelection: () => set(state => {
          state.selectedPortals = [];
        }),

        executeBulkOperation: (operation) => set(state => {
          // Delegate to utility function for bulk operations
          if (operation.operation === BulkOperationType.DELETE) {
            state.portals = state.portals.filter((p: Portal) => !operation.portalIds.includes(p.id));
            state.selectedPortals = state.selectedPortals.filter((id: string) => !operation.portalIds.includes(id));
          }
        }),


        setLoading: (loading) => set(state => {
          state.isLoading = loading;
        }),

        setError: (error) => set(state => {
          state.error = error;
        })
      }),
      {
        name: 'portal-store',
        partialize: (state) => ({
          portals: state.portals,
          filter: state.filter
        })
      }
    )
  )
));