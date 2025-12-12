/**
 * API service for tags and tag groups operations
 */

import { API_CONFIG } from '../config/api';
import { apiClient } from './apiClient';
import {
  TagsGroupsDTO,
  TagsGroupsSummaryDTO,
  NewTagsGroupsDTO,
  UpdateTagsGroupsDTO,
  NewTagDTO,
  UpdateTagDTO,
} from '../types';

export const tagsService = {
  /**
   * Get all tag groups
   */
  async findAllTagGroups(): Promise<TagsGroupsSummaryDTO[]> {
    return apiClient.get<TagsGroupsSummaryDTO[]>(API_CONFIG.endpoints.tags);
  },

  /**
   * Get a specific tag group by ID
   */
  async getTagGroupById(groupId: string): Promise<TagsGroupsDTO[]> {
    return apiClient.get<TagsGroupsDTO[]>(
      `${API_CONFIG.endpoints.tags}/${groupId}`
    );
  },

  /**
   * Create a new tag group
   */
  async createTagGroup(
    tagGroup: NewTagsGroupsDTO
  ): Promise<TagsGroupsDTO> {
    return apiClient.post<TagsGroupsDTO>(API_CONFIG.endpoints.tags, tagGroup);
  },

  /**
   * Update a tag group
   */
  async updateTagGroup(
    groupId: string,
    updates: UpdateTagsGroupsDTO
  ): Promise<TagsGroupsDTO> {
    return apiClient.put<TagsGroupsDTO>(
      `${API_CONFIG.endpoints.tags}/${groupId}`,
      updates
    );
  },

  /**
   * Delete a tag group
   */
  async deleteTagGroup(
    groupId: string,
    force: boolean = false
  ): Promise<boolean> {
    return apiClient.delete<boolean>(
      `${API_CONFIG.endpoints.tags}/${groupId}`,
      { force }
    );
  },

  /**
   * Add a tag to a group
   */
  async addTagToGroup(
    groupId: string,
    tag: NewTagDTO
  ): Promise<TagsGroupsDTO> {
    return apiClient.post<TagsGroupsDTO>(
      `${API_CONFIG.endpoints.tags}/${groupId}/tags`,
      tag
    );
  },

  /**
   * Update a tag in a group
   */
  async updateTagInGroup(
    groupId: string,
    tagId: string,
    updates: UpdateTagDTO
  ): Promise<TagsGroupsDTO> {
    return apiClient.put<TagsGroupsDTO>(
      `${API_CONFIG.endpoints.tags}/${groupId}/tags/${tagId}`,
      updates
    );
  },

  /**
   * Remove a tag from a group
   */
  async removeTagFromGroup(
    groupId: string,
    tagId: string
  ): Promise<TagsGroupsDTO> {
    return apiClient.delete<TagsGroupsDTO>(
      `${API_CONFIG.endpoints.tags}/${groupId}/tags/${tagId}`
    );
  },
};
