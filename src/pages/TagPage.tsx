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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemAvatar,
  ListItemButton,
} from '@mui/material';
import { Add, Delete, Edit, NoteOutlined } from '@mui/icons-material';
import { TagGroup, Tag } from '../types';

interface TagPageProps {
  tagGroups?: TagGroup[];
  isAdmin?: boolean;
  onAddGroup?: (name: string, description: string) => void;
  onEditGroup?: (id: string, name: string, description: string) => void;
  onDeleteGroup?: (id: string) => void;
  onAddTag?: (groupId: string, tagName: string) => Promise<void>;
  onEditTag?: (
    groupId: string,
    tagName: string,
    name: string,
    description: string
  ) => Promise<void>;
  onDeleteTag?: (groupId: string, tagName: string) => Promise<void>;
}

export const TagPage: React.FC<TagPageProps> = ({
  tagGroups = [],
  isAdmin = false,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onAddTag,
  onEditTag,
  onDeleteTag,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TagGroup | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [editMode, setEditMode] = useState(false);

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
      setEditMode(true);
    } else {
      setSelectedGroup(null);
      setGroupName('');
      setGroupDescription('');
      setEditMode(false);
    }
    setNewTagName('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
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

  const handleAddNewTag = async () => {
    if (!newTagName.trim()) {
      alert('Tag name is required');
      return;
    }

    if (!selectedGroup || !onAddTag) return;

    try {
      await onAddTag(selectedGroup.id, newTagName);
      setNewTagName('');
      // Refresh the selected group data
      const updatedGroup = tagGroups.find((g) => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    } catch (err) {
      console.error('Failed to add tag:', err);
      alert('Failed to add tag: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleEditTag = async (tag: Tag) => {
    if (!selectedGroup || !onEditTag) return;

    try {
      await onEditTag(selectedGroup.id, tag.name, tagName, tagDescription);
    } catch (err) {
      console.error('Failed to edit tag:', err);
      alert('Failed to edit tag: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;

    if (!selectedGroup || !onDeleteTag) return;

    try {
      // We need to find the tag ID - for now we're using tag name
      // The backend API expects tag ID, so we'll need to update this
      await onDeleteTag(selectedGroup.id, tag.name);
      // Refresh the selected group data
      const updatedGroup = tagGroups.find((g) => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    } catch (err) {
      console.error('Failed to delete tag:', err);
      alert('Failed to delete tag: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
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
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              margin="normal"
              disabled={!isAdmin}
            />
            <TextField
              fullWidth
              label="Description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              margin="normal"
              disabled={!isAdmin}
              multiline
              rows={2}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 3 }}>
            {selectedGroup && selectedGroup.tags.length > 0 ? (
              <List sx={{ p: 0 }} subheader={<ListSubheader>Tags</ListSubheader>}>
                {selectedGroup.tags.map((tag, idx) => (
                  <>
                    <ListItem key={idx} divider={idx < selectedGroup.tags.length - 1}>
                      <ListItemText
                        primary={tag.name}
                        secondary={tag.description}
                        sx={{ pr: 3, overflow: 'hidden' }}
                        secondaryTypographyProps={{
                          variant: 'subtitle2',
                          style: {
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                        }}
                      />
                      <ListItemSecondaryAction>
                        {onEditTag && (
                          <IconButton
                            edge="end"
                            aria-label="edit tag"
                            size="small"
                            onClick={() => handleOpenTagDialog(tag)}
                            color="default"
                          >
                            {isAdmin ? (
                              <Edit fontSize="small" />
                            ) : (
                              <NoteOutlined fontSize="small" />
                            )}
                          </IconButton>
                        )}
                        {isAdmin && onDeleteTag && (
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
                      </ListItemSecondaryAction>
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

          {isAdmin && editMode && onAddTag && (
            <Box sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  label="New Tag Name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
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
            <Button variant="contained" onClick={handleSave}>
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
