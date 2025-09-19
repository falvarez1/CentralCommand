import React, { createContext, useContext, useMemo } from 'react';
import type { AxiosInstance } from 'axios';
import { apiClient } from '../lib/api/client';
import {
  createPortalService,
  createIncidentService,
  createStatisticsService,
  type IPortalService,
  type IIncidentService,
  type IStatisticsService
} from '../services';

// Service container interface
interface IServiceContainer {
  portalService: IPortalService;
  incidentService: IIncidentService;
  statisticsService: IStatisticsService;
}

// Context for services
const ServiceContext = createContext<IServiceContainer | undefined>(undefined);

// Provider props
interface ServiceProviderProps {
  children: React.ReactNode;
  apiClient?: AxiosInstance; // Allow custom API client injection for testing
}

// Service Provider Component
export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  apiClient: customApiClient
}) => {
  // Create service instances with dependency injection
  const services = useMemo<IServiceContainer>(() => {
    const client = customApiClient || apiClient;

    return {
      portalService: createPortalService(client),
      incidentService: createIncidentService(client),
      statisticsService: createStatisticsService(client)
    };
  }, [customApiClient]);

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

// Hook to use services
export const useServices = (): IServiceContainer => {
  const context = useContext(ServiceContext);

  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }

  return context;
};

// Individual service hooks for convenience
export const usePortalService = (): IPortalService => {
  const { portalService } = useServices();
  return portalService;
};

export const useIncidentService = (): IIncidentService => {
  const { incidentService } = useServices();
  return incidentService;
};

export const useStatisticsService = (): IStatisticsService => {
  const { statisticsService } = useServices();
  return statisticsService;
};