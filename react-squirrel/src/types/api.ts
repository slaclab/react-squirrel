/**
 * API type definitions matching score-backend DTOs
 */

/**
 * PV Element DTOs
 */
export interface PVElementDTO {
  id: string;
  setpointAddress: string;
  readbackAddress?: string;
  description?: string;
  absTolerance?: number;
  relTolerance?: number;
  readOnly?: boolean;
  tags?: string[];
  createdDate: string;
  childType?: string;
  createdBy?: string;
  lastModifiedDate?: string;
  lastModifiedBy?: string;
}

export interface NewPVElementDTO {
  setpointAddress: string;
  readbackAddress?: string;
  description?: string;
  absTolerance?: number;
  relTolerance?: number;
  tags?: string[];
}

export interface UpdatePVElementDTO {
  description?: string;
  absTolerance?: number;
  relTolerance?: number;
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
  metadataPVs?: Record<string, any>;
}

export interface SnapshotDTO extends SnapshotSummaryDTO {
  pvValues: PVValueDTO[];
}

export interface PVValueDTO {
  pvId: string;
  pvName: string;
  value: any;
  status?: number;
  severity?: number;
  timestamp?: string;
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
