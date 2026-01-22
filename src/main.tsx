import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeartbeatProvider } from './contexts/HeartbeatContext';
import { LivePVProvider } from './contexts/LivePVContext';
import { SnapshotProvider } from './contexts/SnapshotContext';
import { AdminModeProvider } from './contexts/AdminModeContext';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

// Create React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AdminModeProvider>
        <HeartbeatProvider pollIntervalMs={2000}>
          <LivePVProvider pollInterval={2000}>
            <SnapshotProvider>
              <RouterProvider router={router} />
            </SnapshotProvider>
          </LivePVProvider>
        </HeartbeatProvider>
      </AdminModeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
