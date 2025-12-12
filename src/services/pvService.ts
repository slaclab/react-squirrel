/**
 * API service for PV operations
 */

import { API_CONFIG, PagedResultDTO } from '../config/api';
import { apiClient } from './apiClient';
import { PVElementDTO, NewPVElementDTO, UpdatePVElementDTO, EpicsValueDTO } from '../types';

/**
 * Server-side search parameters for PVs
 */
export interface PVSearchParams {
  q?: string;
  devices?: string[];
  tags?: string[];
  severities?: string[];
  hasAlarm?: boolean;
  limit?: number;
  offset?: number;
  includeLiveValues?: boolean;
}

export const pvService = {
  /**
   * Search PVs by name
   */
  async findPVs(pvName: string = ''): Promise<PVElementDTO[]> {
    return apiClient.get<PVElementDTO[]>(API_CONFIG.endpoints.pvs, { pvName });
  },

  /**
   * Search PVs with pagination
   */
  async findPVsPaged(params: {
    pvName?: string;
    continuationToken?: string;
    pageSize?: number;
  }): Promise<PagedResultDTO<PVElementDTO>> {
    return apiClient.get<PagedResultDTO<PVElementDTO>>(
      `${API_CONFIG.endpoints.pvs}/paged`,
      params
    );
  },

  /**
   * Search PVs with server-side filtering
   */
  async searchPVs(params: PVSearchParams): Promise<PagedResultDTO<PVElementDTO>> {
    const searchParams = new URLSearchParams();

    if (params.q) searchParams.set('q', params.q);
    if (params.devices?.length) {
      params.devices.forEach((d) => searchParams.append('devices', d));
    }
    if (params.tags?.length) {
      params.tags.forEach((t) => searchParams.append('tags', t));
    }
    if (params.severities?.length) {
      params.severities.forEach((s) => searchParams.append('severity', s));
    }
    if (params.hasAlarm !== undefined) {
      searchParams.set('has_alarm', String(params.hasAlarm));
    }
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    if (params.includeLiveValues) {
      searchParams.set('include_live_values', 'true');
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_CONFIG.endpoints.pvs}/search?${queryString}`
      : `${API_CONFIG.endpoints.pvs}/search`;

    return apiClient.get<PagedResultDTO<PVElementDTO>>(url);
  },

  /**
   * Get live values for a list of PV names from Redis cache
   */
  async getLiveValues(pvNames: string[]): Promise<Record<string, EpicsValueDTO>> {
    const params = new URLSearchParams();
    pvNames.forEach((pv) => params.append('pv_names', pv));
    return apiClient.get<Record<string, EpicsValueDTO>>(
      `${API_CONFIG.endpoints.pvs}/live?${params.toString()}`
    );
  },

  /**
   * Get all cached PV values (for initial table load)
   */
  async getAllLiveValues(): Promise<{ values: Record<string, EpicsValueDTO>; count: number }> {
    return apiClient.get<{ values: Record<string, EpicsValueDTO>; count: number }>(
      `${API_CONFIG.endpoints.pvs}/live/all`
    );
  },

  /**
   * Get Redis cache status
   */
  async getCacheStatus(): Promise<{ cachedPvCount: number; status: string }> {
    return apiClient.get<{ cachedPvCount: number; status: string }>(
      `${API_CONFIG.endpoints.pvs}/cache/status`
    );
  },

  /**
   * Get unique device names for filtering
   */
  async getUniqueDevices(): Promise<string[]> {
    return apiClient.get<string[]>(`${API_CONFIG.endpoints.pvs}/devices`);
  },

  /**
   * Create a new PV
   */
  async createPV(pv: NewPVElementDTO): Promise<PVElementDTO> {
    return apiClient.post<PVElementDTO>(API_CONFIG.endpoints.pvs, pv);
  },

  /**
   * Create multiple PVs
   */
  async createMultiplePVs(pvs: NewPVElementDTO[]): Promise<PVElementDTO[]> {
    return apiClient.post<PVElementDTO[]>(
      `${API_CONFIG.endpoints.pvs}/multi`,
      pvs
    );
  },

  /**
   * Update a PV by ID
   */
  async updatePV(
    pvId: string,
    updates: UpdatePVElementDTO
  ): Promise<PVElementDTO> {
    return apiClient.put<PVElementDTO>(
      `${API_CONFIG.endpoints.pvs}/${pvId}`,
      updates
    );
  },

  /**
   * Delete a PV by ID
   */
  async deletePV(pvId: string, archive: boolean = false): Promise<boolean> {
    return apiClient.delete<boolean>(`${API_CONFIG.endpoints.pvs}/${pvId}`, {
      archive,
    });
  },
};
