import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { TagPage } from '../pages';
import { tagsService } from '../services';
import { useAdminMode } from '../contexts/AdminModeContext';
import { TagGroup } from '../types';

function Tags() {
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdminMode } = useAdminMode();

  const fetchTagGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const summaries = await tagsService.findAllTagGroups();

      // Fetch detailed information for each tag group to get the tags
      const detailedGroups = await Promise.all(
        summaries.map(async (summary) => {
          try {
            const details = await tagsService.getTagGroupById(summary.id);
            // The API returns an array, but we only need the first element
            const groupDetail = details[0];
            return {
              id: groupDetail.id,
              name: groupDetail.name,
              description: groupDetail.description || '',
              tags: groupDetail.tags,
            };
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Failed to fetch details for group ${summary.id}:`, err);
            // Return basic info if detailed fetch fails
            return {
              id: summary.id,
              name: summary.name,
              description: summary.description || '',
              tags: [],
            };
          }
        })
      );

      setTagGroups(detailedGroups);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch tag groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tag groups');
      setTagGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTagGroups();
  }, [fetchTagGroups]);

  const handleAddGroup = async (name: string, description: string) => {
    try {
      await tagsService.createTagGroup({ name, description });
      await fetchTagGroups(); // Refresh the list
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to add tag group:', err);
      // eslint-disable-next-line no-alert
      alert(`Failed to add tag group: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleEditGroup = async (id: string, name: string, description: string) => {
    try {
      await tagsService.updateTagGroup(id, { name, description });
      await fetchTagGroups(); // Refresh the list
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to edit tag group:', err);
      // eslint-disable-next-line no-alert
      alert(`Failed to edit tag group: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    // eslint-disable-next-line no-alert, no-restricted-globals
    if (!confirm('Delete this tag group?')) return;

    try {
      await tagsService.deleteTagGroup(id);
      await fetchTagGroups(); // Refresh the list
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete tag group:', err);
      // eslint-disable-next-line no-alert
      alert(`Failed to delete tag group: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddTag = async (groupId: string, tagName: string) => {
    try {
      await tagsService.addTagToGroup(groupId, { name: tagName });

      // Fetch the updated group details
      const details = await tagsService.getTagGroupById(groupId);
      const updatedGroup = details[0];

      // Update local state for this specific group
      setTagGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId
            ? {
                id: updatedGroup.id,
                name: updatedGroup.name,
                description: updatedGroup.description || '',
                tags: updatedGroup.tags,
              }
            : g
        )
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to add tag:', err);
      throw err; // Re-throw to let the UI handle it
    }
  };

  const handleEditTag = async (
    groupId: string,
    tagName: string,
    newTagName: string,
    newTagDescription: string
  ) => {
    try {
      // Find the tag ID from the tag name
      const foundGroup = tagGroups.find((g) => g.id === groupId);
      if (!foundGroup || !foundGroup.tags) {
        throw new Error('Tag group not found');
      }

      const foundTag = foundGroup.tags.find((t) => t.name === tagName);
      if (!foundTag) {
        throw new Error('Tag not found');
      }

      await tagsService.updateTagInGroup(groupId, foundTag.id, {
        name: newTagName,
        description: newTagDescription,
      });

      // Update local state for this specific group
      setTagGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                tags: g.tags.map((t) =>
                  t.name === tagName
                    ? { ...t, name: newTagName, description: newTagDescription }
                    : t
                ),
              }
            : g
        )
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to edit tag:', err);
      throw err;
    }
  };

  const handleDeleteTag = async (groupId: string, tagName: string) => {
    try {
      // Find the tag ID from the tag name
      const foundGroup = tagGroups.find((g) => g.id === groupId);
      if (!foundGroup || !foundGroup.tags) {
        throw new Error('Tag group not found');
      }

      const foundTag = foundGroup.tags.find((t) => t.name === tagName);
      if (!foundTag) {
        throw new Error('Tag not found');
      }

      await tagsService.removeTagFromGroup(groupId, foundTag.id);
      await fetchTagGroups(); // Refresh the list
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete tag:', err);
      throw err; // Re-throw to let the UI handle it
    }
  };

  if (loading) {
    return <div>Loading tag groups...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <TagPage
      tagGroups={tagGroups}
      isAdmin={isAdminMode}
      onAddGroup={handleAddGroup}
      onEditGroup={handleEditGroup}
      onDeleteGroup={handleDeleteGroup}
      onAddTag={handleAddTag}
      onEditTag={handleEditTag}
      onDeleteTag={handleDeleteTag}
    />
  );
}

export const Route = createFileRoute('/tags')({
  component: Tags,
});
