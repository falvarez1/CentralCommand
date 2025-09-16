import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:5000'),
  VITE_API_TIMEOUT: z.string().transform(Number).default('30000'),
  VITE_ENABLE_MOCK_API: z.string().transform(val => val === 'true').default('false'),
  VITE_SIGNALR_HUB_URL: z.string().url().default('http://localhost:5000/hubs/metrics'),
  VITE_SIGNALR_RECONNECT_INTERVAL: z.string().transform(Number).default('5000'),
  VITE_ENABLE_REALTIME_UPDATES: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('true'),
});

// Parse and validate environment variables
const processEnv = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
  VITE_ENABLE_MOCK_API: import.meta.env.VITE_ENABLE_MOCK_API,
  VITE_SIGNALR_HUB_URL: import.meta.env.VITE_SIGNALR_HUB_URL,
  VITE_SIGNALR_RECONNECT_INTERVAL: import.meta.env.VITE_SIGNALR_RECONNECT_INTERVAL,
  VITE_ENABLE_REALTIME_UPDATES: import.meta.env.VITE_ENABLE_REALTIME_UPDATES,
  VITE_ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = {
  api: {
    baseUrl: parsed.data.VITE_API_BASE_URL,
    timeout: parsed.data.VITE_API_TIMEOUT,
    enableMock: parsed.data.VITE_ENABLE_MOCK_API,
  },
  signalr: {
    hubUrl: parsed.data.VITE_SIGNALR_HUB_URL,
    reconnectInterval: parsed.data.VITE_SIGNALR_RECONNECT_INTERVAL,
  },
  features: {
    enableRealtimeUpdates: parsed.data.VITE_ENABLE_REALTIME_UPDATES,
    enableErrorReporting: parsed.data.VITE_ENABLE_ERROR_REPORTING,
  },
} as const;

// Type exports for use in other files
export type EnvConfig = typeof env;