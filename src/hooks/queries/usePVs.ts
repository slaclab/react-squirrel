import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pvService, PVSearchParams } from '../../services/pvService';
import { tagsService } from '../../services/tagsService';

/**
 * Query key factory for PV-related queries
 */
export const pvKeys = {
  all: ['pvs'] as const,
  lists: () => [...pvKeys.all, 'list'] as const,
  list: (params: PVSearchParams) => [...pvKeys.lists(), params] as const,
  search: (params: PVSearchParams) => [...pvKeys.all, 'search', params] as const,
  details: () => [...pvKeys.all, 'detail'] as const,
  detail: (id: string) => [...pvKeys.details(), id] as const,
  devices: () => [...pvKeys.all, 'devices'] as const,
};

/**
 * Hook for searching PVs with server-side filtering
 */
export function usePVSearch(params: PVSearchParams, enabled = true) {
  return useQuery({
    queryKey: pvKeys.search(params),
    queryFn: () => pvService.searchPVs(params),
    placeholderData: (previousData) => previousData,
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for fetching all PVs (basic list)
 */
export function usePVs(pvName?: string) {
  return useQuery({
    queryKey: pvKeys.list({ q: pvName }),
    queryFn: () => pvService.findPVs(pvName),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for fetching unique device names
 */
export function useDevices() {
  return useQuery({
    queryKey: pvKeys.devices(),
    queryFn: () => pvService.getUniqueDevices(),
    staleTime: 5 * 60 * 1000, // 5 minutes - device list changes rarely
  });
}

/**
 * Hook for fetching available filter options (devices + tag groups)
 */
export function useAvailableFilters() {
  return useQuery({
    queryKey: ['filters', 'available'],
    queryFn: async () => {
      const [devices, tagGroups] = await Promise.all([
        pvService.getUniqueDevices().catch(() => [] as string[]),
        tagsService.findAllTagGroups().catch(() => []),
      ]);
      return { devices, tagGroups };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating a new PV
 */
export function useCreatePV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pvService.createPV,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pvKeys.all });
    },
  });
}

/**
 * Hook for creating multiple PVs
 */
export function useCreateMultiplePVs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pvService.createMultiplePVs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pvKeys.all });
    },
  });
}

/**
 * Hook for updating a PV
 */
export function useUpdatePV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pvId,
      updates,
    }: {
      pvId: string;
      updates: Parameters<typeof pvService.updatePV>[1];
    }) => pvService.updatePV(pvId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pvKeys.detail(variables.pvId) });
      queryClient.invalidateQueries({ queryKey: pvKeys.lists() });
    },
  });
}

/**
 * Hook for deleting a PV
 */
export function useDeletePV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pvId, archive = false }: { pvId: string; archive?: boolean }) =>
      pvService.deletePV(pvId, archive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pvKeys.all });
    },
  });
}

export default {
  usePVSearch,
  usePVs,
  useDevices,
  useAvailableFilters,
  useCreatePV,
  useCreateMultiplePVs,
  useUpdatePV,
  useDeletePV,
};
