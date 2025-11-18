/**
 * API service for snapshot operations
 */

import { API_CONFIG } from '../config/api';
import { apiClient } from './apiClient';
import {
  SnapshotDTO,
  SnapshotSummaryDTO,
  NewSnapshotDTO,
  FindParameter,
} from '../types';

export const snapshotService = {
  /**
   * Get all snapshots with optional filters
   */
  async findSnapshots(params?: {
    title?: string;
    tags?: string[];
    metadataPVs?: string[];
  }): Promise<SnapshotSummaryDTO[]> {
    return apiClient.get<SnapshotSummaryDTO[]>(
      API_CONFIG.endpoints.snapshots,
      params
    );
  },

  /**
   * Get a specific snapshot by ID
   */
  async getSnapshotById(snapshotId: string): Promise<SnapshotDTO> {
    return apiClient.get<SnapshotDTO>(
      `${API_CONFIG.endpoints.snapshots}/${snapshotId}`
    );
  },

  /**
   * Create a new snapshot
   */
  async createSnapshot(snapshot: NewSnapshotDTO): Promise<SnapshotSummaryDTO> {
    return apiClient.post<SnapshotSummaryDTO>(
      API_CONFIG.endpoints.snapshots,
      snapshot
    );
  },

  /**
   * Delete a snapshot by ID
   */
  async deleteSnapshot(
    snapshotId: string,
    deleteData: boolean = true
  ): Promise<boolean> {
    return apiClient.delete<boolean>(
      `${API_CONFIG.endpoints.snapshots}/${snapshotId}`,
      { deleteData }
    );
  },
};
