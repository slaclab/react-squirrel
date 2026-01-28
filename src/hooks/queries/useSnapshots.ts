import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { snapshotService } from '../../services/snapshotService';

/**
 * Query key factory for snapshot-related queries
 */
export const snapshotKeys = {
  all: ['snapshots'] as const,
  lists: () => [...snapshotKeys.all, 'list'] as const,
  list: (filters?: { title?: string; tags?: string[] }) =>
    [...snapshotKeys.lists(), filters] as const,
  details: () => [...snapshotKeys.all, 'detail'] as const,
  detail: (id: string) => [...snapshotKeys.details(), id] as const,
};

/**
 * Hook for fetching all snapshots
 */
export function useSnapshots(params?: { title?: string; tags?: string[]; metadataPVs?: string[] }) {
  return useQuery({
    queryKey: snapshotKeys.list(params),
    queryFn: () => snapshotService.findSnapshots(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for fetching a single snapshot by ID with optional pagination
 */
export function useSnapshot(snapshotId: string, options?: { limit?: number; offset?: number }) {
  const { limit, offset = 0 } = options || {};

  return useQuery({
    queryKey: [...snapshotKeys.detail(snapshotId), { limit, offset }],
    queryFn: () => snapshotService.getSnapshotById(snapshotId, limit, offset),
    enabled: !!snapshotId,
    staleTime: 60 * 1000, // 1 minute
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for creating a snapshot asynchronously
 */
export function useCreateSnapshotAsync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: snapshotService.createSnapshotAsync,
    onSuccess: () => {
      // Invalidate snapshots list after job completes
      // Note: The actual snapshot is created async, so we may want to
      // poll the job status separately
      queryClient.invalidateQueries({ queryKey: snapshotKeys.lists() });
    },
  });
}

/**
 * Hook for creating a snapshot synchronously
 * @deprecated Use useCreateSnapshotAsync for large PV counts
 */
export function useCreateSnapshotSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: snapshotService.createSnapshotSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snapshotKeys.lists() });
    },
  });
}

/**
 * Hook for deleting a snapshot
 */
export function useDeleteSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ snapshotId, deleteData = true }: { snapshotId: string; deleteData?: boolean }) =>
      snapshotService.deleteSnapshot(snapshotId, deleteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snapshotKeys.all });
    },
  });
}

export default {
  useSnapshots,
  useSnapshot,
  useCreateSnapshotAsync,
  useCreateSnapshotSync,
  useDeleteSnapshot,
};
