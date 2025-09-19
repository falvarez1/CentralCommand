import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { PortalService } from '../portal.service';
import type { PortalResponse, PortalCreateRequest } from '../../types/service.types';

describe('PortalService', () => {
  // Mock axios instance
  const createMockApiClient = (): AxiosInstance => {
    return {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      request: vi.fn(),
      getUri: vi.fn(),
      head: vi.fn(),
      options: vi.fn(),
      defaults: {} as any,
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() }
      }
    } as unknown as AxiosInstance;
  };

  it('should create portal service with dependency injection', () => {
    const mockApiClient = createMockApiClient();
    const portalService = new PortalService(mockApiClient);

    expect(portalService).toBeDefined();
    expect(portalService.getPortals).toBeDefined();
    expect(portalService.createPortal).toBeDefined();
  });

  it('should call apiClient.get when fetching portals', async () => {
    const mockApiClient = createMockApiClient();
    const mockResponse = {
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0
      }
    };

    (mockApiClient.get as any).mockResolvedValue(mockResponse);

    const portalService = new PortalService(mockApiClient);
    const result = await portalService.getPortals({ page: 1, pageSize: 10 });

    expect(mockApiClient.get).toHaveBeenCalledWith('/api/portals', { params: { page: 1, pageSize: 10 } });
    expect(result).toEqual(mockResponse.data);
  });

  it('should call apiClient.post when creating a portal', async () => {
    const mockApiClient = createMockApiClient();
    const mockPortal: PortalCreateRequest = {
      name: 'Test Portal',
      url: 'https://test.example.com',
      category: 'Application',
      environment: 'Production',
      status: 'Operational'
    };

    const mockResponse = {
      data: {
        id: '123',
        ...mockPortal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as PortalResponse
    };

    (mockApiClient.post as any).mockResolvedValue(mockResponse);

    const portalService = new PortalService(mockApiClient);
    const result = await portalService.createPortal(mockPortal);

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/portals', mockPortal);
    expect(result).toEqual(mockResponse.data);
  });

  it('should call apiClient.delete when deleting a portal', async () => {
    const mockApiClient = createMockApiClient();
    const portalId = '123';

    (mockApiClient.delete as any).mockResolvedValue({ data: null });

    const portalService = new PortalService(mockApiClient);
    await portalService.deletePortal(portalId);

    expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/portals/${portalId}`);
  });
});

describe('PortalService with ServiceProvider', () => {
  it('can be mocked in ServiceProvider for testing', () => {
    // Example of how to use with React Testing Library
    const mockApiClient = createMockApiClient();

    // You can create a test wrapper like this:
    // const wrapper = ({ children }) => (
    //   <ServiceProvider apiClient={mockApiClient}>
    //     {children}
    //   </ServiceProvider>
    // );

    // Then use it in your tests:
    // const { result } = renderHook(() => usePortalService(), { wrapper });

    expect(mockApiClient).toBeDefined();
  });
});