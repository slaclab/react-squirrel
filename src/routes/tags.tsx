import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { TagPage } from '../pages';
import { tagsService } from '../services';
import { useAdminMode } from '../contexts/AdminModeContext';
import { TagGroup } from '../types';

export const Route = createFileRoute('/tags')({
  component: Tags,
});

function Tags() {
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdminMode } = useAdminMode();

  useEffect(() => {
    fetchTagGroups();
  }, []);

  const fetchTagGroups = async () => {
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
            const group = details[0];
            return {
              id: group.id,
              name: group.name,
              description: group.description || '',
              tags: group.tags,
            };
          } catch (err) {
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
      console.error('Failed to fetch tag groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tag groups');
      setTagGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (name: string, description: string) => {
    try {
      await tagsService.createTagGroup({ name, description });
      await fetchTagGroups(); // Refresh the list
    } catch (err) {
      console.error('Failed to add tag group:', err);
      alert('Failed to add tag group: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleEditGroup = async (id: string, name: string, description: string) => {
    try {
      await tagsService.updateTagGroup(id, { name, description });
      await fetchTagGroups(); // Refresh the list
    } catch (err) {
      console.error('Failed to edit tag group:', err);
      alert('Failed to edit tag group: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Delete this tag group?')) return;

    try {
      await tagsService.deleteTagGroup(id);
      await fetchTagGroups(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete tag group:', err);
      alert(
        'Failed to delete tag group: ' + (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  const handleAddTag = async (groupId: string, tagName: string) => {
    try {
      await tagsService.addTagToGroup(groupId, { name: tagName });
      await fetchTagGroups(); // Refresh the list to get updated tags
    } catch (err) {
      console.error('Failed to add tag:', err);
      throw err; // Re-throw to let the UI handle it
    }
  };

  const handleDeleteTag = async (groupId: string, tagId: string) => {
    try {
      // Find the tag ID from the tag name
      const group = tagGroups.find((g) => g.id === groupId);
      if (!group || !group.tags) {
        throw new Error('Tag group not found');
      }

      const tag = group.tags.find((t) => t.name === tagName);
      if (!tag) {
        throw new Error('Tag not found');
      }

      await tagsService.removeTagFromGroup(groupId, tag.id);
      await fetchTagGroups(); // Refresh the list
    } catch (err) {
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
      onDeleteTag={handleDeleteTag}
    />
  );
}
