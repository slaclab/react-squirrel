/**
 * API service for job status operations
 */

import { API_CONFIG } from '../config/api';
import { apiClient } from './apiClient';
import { JobDTO } from '../types';

export const jobService = {
  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<JobDTO> {
    return apiClient.get<JobDTO>(`${API_CONFIG.endpoints.jobs}/${jobId}`);
  },
};
