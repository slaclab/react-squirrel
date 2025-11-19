/**
 * API service for PV operations
 */

import { API_CONFIG, PagedResultDTO } from '../config/api';
import { apiClient } from './apiClient';
import { PVElementDTO, NewPVElementDTO, UpdatePVElementDTO } from '../types';

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
