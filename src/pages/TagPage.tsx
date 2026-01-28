import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  ListSubheader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import { Add, Delete, Edit, NewReleasesOutlined, NoteOutlined } from '@mui/icons-material';
import { TagGroup, Tag } from '../types';
import { PendingTagGroupChanges } from '../routes/tags';

interface TagPageProps {
  tagGroups?: TagGroup[];
  isAdmin?: boolean;
  onAddGroup?: (name: string, description: string) => void;
  onEditGroup?: (id: string, name: string, description: string) => void;
  onDeleteGroup?: (id: string) => void;
}

export const TagPage: React.FC<TagPageProps> = ({
  tagGroups = [],
  isAdmin = false,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TagGroup | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<PendingTagGroupChanges | null>(null);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [tagName, setTagName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Sync selectedGroup when tagGroups prop changes
  useEffect(() => {
    if (selectedGroup) {
      const updatedGroup = tagGroups.find((g) => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    }
  }, [tagGroups]);

  const handleOpenDialog = (group?: TagGroup) => {
    if (group) {
      setSelectedGroup(group);
      setGroupName(group.name);
      setGroupDescription(group.description);
      setDraft({
        groupId: group.id,
        groupChanges: { name: group.name, description: group.description || '' },
        tagsToAdd: [],
        tagsToEdit: new Map(),
        tagsToDelete: new Set(),
      });
      setEditMode(true);
    } else {
      setSelectedGroup(null);
      setGroupName('');
      setGroupDescription('');
      setDraft(null);
      setEditMode(false);
    }
    setNewTagName('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDraft(null);
    setSelectedGroup(null);
    setGroupName('');
    setGroupDescription('');
    setNewTagName('');
  };

  const handleOpenTagDialog = (tag?: Tag) => {
    if (tag) {
      setSelectedTag(tag);
      setTagName(tag.name);
      setTagDescription(tag.description || '');
      setEditMode(true);
    } else {
      setSelectedTag(null);
      setTagName('');
      setTagDescription('');
      setEditMode(false);
    }
    setTagDialogOpen(true);
  };

  const handleCloseTagDialog = () => {
    setTagDialogOpen(false);
    setSelectedTag(null);
    setTagName('');
    setTagDescription('');
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      alert('Group name is required');
      return;
    }

    try {
      if (editMode && selectedGroup && onEditGroup) {
        await onEditGroup(selectedGroup.id, groupName, groupDescription);
      } else if (!editMode && onAddGroup) {
        await onAddGroup(groupName, groupDescription);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save tag group:', err);
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const groupNameChanged = draft?.groupChanges.name !== selectedGroup?.name;
  const groupDescriptionChanged = draft?.groupChanges.description !== selectedGroup?.description;

  const draftHasTags = (draft: PendingTagGroupChanges | null): boolean => {
    if (!draft) return false;
    return draft.tagsToAdd.length > 0 || draft.tagsToEdit.size > 0 || draft.tagsToDelete.size > 0;
  };

  function draftIsEmpty(draft: PendingTagGroupChanges | null): boolean {
    if (!draft) return true;
    if (draftHasTags(draft)) return false;
    if (groupNameChanged) return false;
    if (groupDescriptionChanged) return false;
    return true;
  }

  const isTagNameInUse = (name: string, excludeTagId?: string): boolean => {
    if (!selectedGroup) return false;

    // Check existing tags
    if (selectedGroup.tags.some((t) => t.name === name && t.id !== excludeTagId)) {
      return true;
    }

    // Check tags being added to draft
    if (draft?.tagsToAdd.some((t) => t.name === name)) {
      return true;
    }

    // Check tags being edited in draft
    for (const [tagId, editData] of draft?.tagsToEdit || []) {
      if (editData.name === name && tagId !== excludeTagId) {
        return true;
      }
    }

    return false;
  };

  const isTagInDraft = (tag: Tag): boolean => {
    if (!draft) return false;

    // Check if being added (tags without ID)
    if (!tag.id && draft.tagsToAdd.some((t) => t.name === tag.name)) {
      return true;
    }

    // Check if being edited or deleted
    if (tag.id) {
      if (draft.tagsToEdit.has(tag.id) || draft.tagsToDelete.has(tag.id)) {
        return true;
      }
    }

    return false;
  };

  const getDisplayTags = (): Tag[] => {
    if (!selectedGroup || !draft) return selectedGroup?.tags || [];

    // Start with original tags, excluding deleted ones, and apply edits
    const displayTags = selectedGroup.tags
      .filter((tag) => !draft.tagsToDelete.has(tag.id || ''))
      .map((tag) => {
        if (tag.id && draft.tagsToEdit.has(tag.id)) {
          const edits = draft.tagsToEdit.get(tag.id)!;
          return {
            ...tag,
            name: edits.name,
            description: edits.description,
          };
        }
        return tag;
      });

    // Add new tags (with temporary display data)
    const newTags = draft.tagsToAdd.map((t) => ({
      id: undefined as any,
      name: t.name,
      description: t.description,
    }));

    return [...displayTags, ...newTags];
  };

  const handleAddNewTag = async () => {
    if (!newTagName.trim()) {
      alert('Tag name is required');
      return;
    }
    if (!selectedGroup) return;

    if (isTagNameInUse(newTagName)) {
      alert(`Tag "${newTagName}" already exists in this group`);
      return;
    }

    setDraft((prev) =>
      prev
        ? {
            ...prev,
            tagsToAdd: [...prev.tagsToAdd, { name: newTagName, description: '' }],
          }
        : null
    );
    setNewTagName('');
  };

  const handleEditTag = async (tag: Tag) => {
    if (!selectedGroup) return;

    // Check if new name is already in use (excluding the current tag)
    if (tagName !== tag.name && isTagNameInUse(tagName, tag.id)) {
      alert(`Tag "${tagName}" already exists in this group`);
      return;
    }

    if (!tag.id) {
      if (draft?.tagsToAdd.find((t) => t.name === tag.name)) {
        setDraft((prev) =>
          prev
            ? {
                ...prev,
                tagsToAdd: prev.tagsToAdd.map((t) =>
                  t.name === tag.name ? { name: tagName, description: tagDescription } : t
                ),
              }
            : null
        );
        return;
      } else {
        throw new Error('Tag ID is missing');
      }
    }

    setDraft((prev) => {
      if (!prev) return null;

      const newDeleteSet = new Set(prev.tagsToDelete);
      if (newDeleteSet.has(tag.id!)) {
        newDeleteSet.delete(tag.id!);
      }

      const newEditMap = new Map(prev.tagsToEdit);

      // If values match original, remove from edits; otherwise add/update
      if (tagName === tag.name && tagDescription === tag.description) {
        newEditMap.delete(tag.id!);
      } else {
        newEditMap.set(tag.id!, {
          name: tagName,
          description: tagDescription,
        });
      }

      return {
        ...prev,
        tagsToDelete: newDeleteSet,
        tagsToEdit: newEditMap,
      };
    });
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
    if (!selectedGroup) return;

    if (!tag.id) {
      if (draft?.tagsToAdd.find((t) => t.name === tag.name)) {
        setDraft((prev) =>
          prev
            ? {
                ...prev,
                tagsToAdd: prev.tagsToAdd.filter((t) => t.name !== tag.name),
              }
            : null
        );
        return;
      } else {
        throw new Error('Tag ID is missing');
      }
    }

    setDraft((prev) => {
      if (!prev) return null;

      // Remove from edits if present
      const newEditMap = new Map(prev.tagsToEdit);
      if (newEditMap.has(tag.id!)) {
        newEditMap.delete(tag.id!);
      }

      return {
        ...prev,
        tagsToEdit: newEditMap,
        tagsToDelete: new Set(prev.tagsToDelete).add(tag.id!),
      };
    });
  };

  const handleRowClick = (group: TagGroup) => {
    handleOpenDialog(group);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 2 }}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h5" fontWeight="bold">
          Tag Groups
        </Typography>
        {isAdmin && onAddGroup && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="medium"
          >
            New Group
          </Button>
        )}
      </Stack>

      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 200 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Group Name
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ width: 100 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Tag Count
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Description
                </Typography>
              </TableCell>
              {isAdmin && onDeleteGroup && (
                <TableCell align="center" sx={{ width: 80 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Actions
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {tagGroups.map((group) => (
              <TableRow
                key={group.id}
                hover
                sx={{ cursor: 'pointer' }}
                onDoubleClick={() => handleRowClick(group)}
              >
                <TableCell>
                  <Chip label={group.name} color="primary" variant="outlined" />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {group.tags.length} {group.tags.length === 1 ? 'Tag' : 'Tags'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {group.description}
                  </Typography>
                </TableCell>
                {isAdmin && onDeleteGroup && (
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup(group.id);
                      }}
                      aria-label="Delete group"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tagGroups.length === 0 && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No tag groups available
            </Typography>
            {isAdmin && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click &quot;New Group&quot; to create your first tag group
              </Typography>
            )}
          </Box>
        )}
      </TableContainer>

      {/* Tag Group Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isAdmin ? (editMode ? 'Edit Tag Group' : 'New Tag Group') : 'Tag Group Details'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
          <Box sx={{ px: 3, pt: 1, borderBottom: '1px solid #eee' }}>
            <TextField
              fullWidth
              label="Title"
              value={draft?.groupChanges?.name || ''}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        groupChanges: {
                          name: e.target.value,
                          description: prev.groupChanges?.description || '',
                        },
                      }
                    : null
                )
              }
              margin="normal"
              disabled={!isAdmin}
            />
            <TextField
              fullWidth
              label="Description"
              value={draft?.groupChanges?.description || ''}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        groupChanges: {
                          name: prev.groupChanges?.name || '',
                          description: e.target.value,
                        },
                      }
                    : null
                )
              }
              margin="normal"
              disabled={!isAdmin}
              multiline
              rows={2}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 3 }}>
            {selectedGroup && getDisplayTags().length > 0 ? (
              <List sx={{ p: 0 }} subheader={<ListSubheader>Tags</ListSubheader>}>
                {getDisplayTags().map((tag, idx) => (
                  <>
                    <ListItem
                      key={tag.id || `temp-${tag.name}`}
                      divider={idx < getDisplayTags().length - 1}
                    >
                      <ListItemText
                        primary={tag.name}
                        secondary={tag.description}
                        sx={{ overflow: 'hidden' }}
                        secondaryTypographyProps={{
                          variant: 'subtitle2',
                          style: {
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                        }}
                      />
                      {isAdmin && draftHasTags(draft) && (
                        <ListItemIcon sx={{ minWidth: '26px' }}>
                          {isTagInDraft(tag) && (
                            <Tooltip title="Tag has unsaved changes">
                              <NewReleasesOutlined color="info" />
                            </Tooltip>
                          )}
                        </ListItemIcon>
                      )}
                      <IconButton
                        edge="end"
                        aria-label="edit tag"
                        size="small"
                        onClick={() => handleOpenTagDialog(tag)}
                        color="default"
                      >
                        {isAdmin ? <Edit fontSize="small" /> : <NoteOutlined fontSize="small" />}
                      </IconButton>
                      {isAdmin && (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          size="small"
                          onClick={() => handleDeleteTag(tag)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </ListItem>
                  </>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No tags in this group
              </Typography>
            )}
          </Box>

          {isAdmin && editMode && (
            <Box sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  label="New Tag Name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                  fullWidth
                />
                <Button
                  startIcon={<Add />}
                  onClick={handleAddNewTag}
                  variant="outlined"
                  size="small"
                  disabled={!newTagName.trim()}
                >
                  Add
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{isAdmin ? 'Cancel' : 'Close'}</Button>
          {isAdmin && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={draftIsEmpty(draft) || !groupName.trim()}
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog
        open={dialogOpen && tagDialogOpen}
        onClose={handleCloseTagDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{isAdmin ? 'Edit Tag' : 'Tag Details'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Tag Name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              margin="normal"
              disabled={!isAdmin}
            />
            <TextField
              fullWidth
              label="Tag Description"
              value={tagDescription}
              onChange={(e) => setTagDescription(e.target.value)}
              margin="normal"
              disabled={!isAdmin}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTagDialog}>{isAdmin ? 'Cancel' : 'Close'}</Button>
          {isAdmin && (
            <Button
              variant="contained"
              onClick={async (e) => {
                e.stopPropagation();
                if (selectedTag) {
                  await handleEditTag(selectedTag);
                  handleCloseTagDialog();
                }
              }}
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
