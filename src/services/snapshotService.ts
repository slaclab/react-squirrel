/**
 * API service for snapshot operations
 */

import { API_CONFIG } from '../config/api';
import { apiClient } from './apiClient';
import { SnapshotDTO, SnapshotSummaryDTO, NewSnapshotDTO, JobCreatedDTO } from '../types';

export const snapshotService = {
  /**
   * Get all snapshots with optional filters (lightweight summary only)
   */
  async findSnapshots(params?: {
    title?: string;
    tags?: string[];
    metadataPVs?: string[];
  }): Promise<SnapshotSummaryDTO[]> {
    return apiClient.get<SnapshotSummaryDTO[]>(API_CONFIG.endpoints.snapshots, params);
  },

  /**
   * Get a specific snapshot by ID with optional pagination for PV values
   *
   * @param snapshotId - The snapshot ID
   * @param limit - Max number of PV values to return (undefined = all)
   * @param offset - Number of values to skip for pagination
   */
  async getSnapshotById(
    snapshotId: string,
    limit?: number,
    offset: number = 0
  ): Promise<SnapshotDTO> {
    const params: Record<string, string | number> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset > 0) params.offset = offset;

    return apiClient.get<SnapshotDTO>(
      `${API_CONFIG.endpoints.snapshots}/${snapshotId}`,
      Object.keys(params).length > 0 ? params : undefined
    );
  },

  /**
   * Create a new snapshot (async mode - returns job ID for polling)
   */
  async createSnapshotAsync(snapshot: NewSnapshotDTO): Promise<JobCreatedDTO> {
    return apiClient.post<JobCreatedDTO>(`${API_CONFIG.endpoints.snapshots}?async=true`, snapshot);
  },

  /**
   * Create a new snapshot (sync mode - blocks until complete)
   * @deprecated Use createSnapshotAsync for large PV counts
   */
  async createSnapshotSync(snapshot: NewSnapshotDTO): Promise<SnapshotSummaryDTO> {
    return apiClient.post<SnapshotSummaryDTO>(
      `${API_CONFIG.endpoints.snapshots}?async=false`,
      snapshot
    );
  },

  /**
   * Delete a snapshot by ID
   */
  async deleteSnapshot(snapshotId: string, deleteData: boolean = true): Promise<boolean> {
    return apiClient.delete<boolean>(`${API_CONFIG.endpoints.snapshots}/${snapshotId}`, {
      deleteData,
    });
  },
};
