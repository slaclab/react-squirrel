/**
 * API type definitions matching score-backend DTOs
 */

/**
 * PV Element DTOs - matches backend app/schemas/pv.py
 */
export interface PVElementDTO {
  id: string;
  setpointAddress: string | null;
  readbackAddress?: string | null;
  configAddress?: string | null;
  device?: string | null;
  description?: string | null;
  absTolerance: number;
  relTolerance: number;
  readOnly: boolean;
  tags: TagDTO[];
  createdDate: string;
  createdBy?: string | null;
  lastModifiedDate: string;
  lastModifiedBy?: string | null;
}

export interface NewPVElementDTO {
  setpointAddress?: string | null;
  readbackAddress?: string | null;
  configAddress?: string | null;
  device?: string | null;
  description?: string | null;
  absTolerance?: number;
  relTolerance?: number;
  readOnly?: boolean;
  tags?: string[]; // Tag IDs
}

export interface UpdatePVElementDTO {
  description?: string | null;
  absTolerance?: number | null;
  relTolerance?: number | null;
  readOnly?: boolean | null;
  tags?: string[] | null; // Tag IDs
}

/**
 * Snapshot DTOs
 */
export interface SnapshotSummaryDTO {
  id: string;
  title: string;
  comment?: string;
  tags?: string[];
  createdDate: string;
  createdBy: string;
  pvCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadataPVs?: Record<string, any>;
}

export interface SnapshotDTO extends SnapshotSummaryDTO {
  pvValues: PVValueDTO[];
}

export interface EpicsValueDTO {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  status?: number;
  severity?: number;
  timestamp?: string;
  units?: string;
  precision?: number;
  upper_ctrl_limit?: number;
  lower_ctrl_limit?: number;
}

export interface TagInfoDTO {
  id: string;
  name: string;
  groupName: string;
}

export interface PVValueDTO {
  pvId: string;
  pvName: string;
  setpointName?: string | null; // Actual setpoint PV address
  readbackName?: string | null; // Actual readback PV address
  setpointValue?: EpicsValueDTO | null;
  readbackValue?: EpicsValueDTO | null;
  status?: number;
  severity?: number;
  timestamp?: string;
  tags?: TagInfoDTO[];
}

export interface NewSnapshotDTO {
  title: string;
  comment?: string;
  tags?: string[];
  pvIds?: string[];
}

/**
 * Tags DTOs
 */
export interface TagDTO {
  id: string;
  name: string;
  description?: string;
}

export interface NewTagDTO {
  name: string;
  description?: string;
}

export interface UpdateTagDTO {
  name?: string;
  description?: string;
}

export interface TagsGroupsDTO {
  id: string;
  name: string;
  description?: string;
  tags: TagDTO[];
  createdDate: string;
  createdBy: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
}

export interface TagsGroupsSummaryDTO {
  id: string;
  name: string;
  description?: string;
  tagCount?: number; // Optional - may not be in all responses
}

export interface NewTagsGroupsDTO {
  name: string;
  description?: string;
}

export interface UpdateTagsGroupsDTO {
  name?: string;
  description?: string;
}

/**
 * Search/Filter parameters
 */
export interface FindParameter {
  title?: string;
  tags?: string[];
}

/**
 * Job DTOs for async task tracking
 */
export interface JobDTO {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  resultId?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface JobCreatedDTO {
  jobId: string;
  message: string;
}
