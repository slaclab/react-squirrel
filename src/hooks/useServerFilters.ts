import { useState, useEffect, useCallback, useMemo } from 'react';
import { Severity } from '../types';

export interface FilterState {
  searchTerm: string;
  devices: string[];
  tags: string[];
  severities: Severity[];
  hasAlarm: boolean | null;
}

export interface UseServerFiltersReturn {
  filters: FilterState;
  setSearchTerm: (term: string) => void;
  toggleDevice: (device: string) => void;
  setDevices: (devices: string[]) => void;
  toggleTag: (tagId: string) => void;
  setTags: (tags: string[]) => void;
  toggleSeverity: (severity: Severity) => void;
  setSeverities: (severities: Severity[]) => void;
  toggleAlarmFilter: () => void;
  clearFilters: () => void;
  debouncedFilters: FilterState;
  hasActiveFilters: boolean;
}

const initialFilters: FilterState = {
  searchTerm: '',
  devices: [],
  tags: [],
  severities: [],
  hasAlarm: null,
};

/**
 * Hook for managing server-side filter state with debouncing
 *
 * @param debounceMs - Debounce delay for search term (default: 300ms)
 * @returns Filter state and actions
 */
export function useServerFilters(debounceMs: number = 300): UseServerFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(filters);

  // Debounce search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, debounceMs]);

  const setSearchTerm = useCallback((term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const toggleDevice = useCallback((device: string) => {
    setFilters((prev) => ({
      ...prev,
      devices: prev.devices.includes(device)
        ? prev.devices.filter((d) => d !== device)
        : [...prev.devices, device],
    }));
  }, []);

  const setDevices = useCallback((devices: string[]) => {
    setFilters((prev) => ({ ...prev, devices }));
  }, []);

  const toggleTag = useCallback((tagId: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }));
  }, []);

  const setTags = useCallback((tags: string[]) => {
    setFilters((prev) => ({ ...prev, tags }));
  }, []);

  const toggleSeverity = useCallback((severity: Severity) => {
    setFilters((prev) => ({
      ...prev,
      severities: prev.severities.includes(severity)
        ? prev.severities.filter((s) => s !== severity)
        : [...prev.severities, severity],
    }));
  }, []);

  const setSeverities = useCallback((severities: Severity[]) => {
    setFilters((prev) => ({ ...prev, severities }));
  }, []);

  const toggleAlarmFilter = useCallback(() => {
    setFilters((prev) => {
      if (prev.hasAlarm === null) {
        return { ...prev, hasAlarm: true };
      }
      if (prev.hasAlarm) {
        return { ...prev, hasAlarm: false };
      }
      return { ...prev, hasAlarm: null };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.searchTerm !== '' ||
      filters.devices.length > 0 ||
      filters.tags.length > 0 ||
      filters.severities.length > 0 ||
      filters.hasAlarm !== null,
    [filters]
  );

  return {
    filters,
    setSearchTerm,
    toggleDevice,
    setDevices,
    toggleTag,
    setTags,
    toggleSeverity,
    setSeverities,
    toggleAlarmFilter,
    clearFilters,
    debouncedFilters,
    hasActiveFilters,
  };
}

export default useServerFilters;
