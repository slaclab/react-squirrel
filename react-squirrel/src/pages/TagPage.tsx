import React, { useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';

interface TagGroup {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

interface TagPageProps {
  tagGroups?: TagGroup[];
  isAdmin?: boolean;
  onAddGroup?: (name: string, description: string) => void;
  onEditGroup?: (id: string, name: string, description: string, tags: string[]) => void;
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
  const [selectedGroup, setSelectedGroup] = useState<TagGroup | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleOpenDialog = (group?: TagGroup) => {
    if (group) {
      setSelectedGroup(group);
      setEditMode(true);
    } else {
      setSelectedGroup(null);
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleRowClick = (group: TagGroup) => {
    handleOpenDialog(group);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', p: 2 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight="bold">
          Tag Groups
        </Typography>
        {isAdmin && onAddGroup && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} size="medium">
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
                Click "New Group" to create your first tag group
              </Typography>
            )}
          </Box>
        )}
      </TableContainer>

      {/* Tag Group Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? (selectedGroup?.name || 'Tag Group') : 'New Tag Group'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              defaultValue={selectedGroup?.name || ''}
              margin="normal"
              disabled={!isAdmin}
            />
            <TextField
              fullWidth
              label="Description"
              defaultValue={selectedGroup?.description || ''}
              margin="normal"
              disabled={!isAdmin}
            />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Tags
            </Typography>
            {selectedGroup && selectedGroup.tags.length > 0 ? (
              <List dense>
                {selectedGroup.tags.map((tag, idx) => (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      isAdmin && (
                        <IconButton edge="end" aria-label="delete" size="small">
                          <Delete fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText primary={tag} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tags in this group
              </Typography>
            )}
            {isAdmin && (
              <Button startIcon={<Add />} size="small" sx={{ mt: 1 }}>
                Add New Tag
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {isAdmin ? 'Cancel' : 'Close'}
          </Button>
          {isAdmin && <Button variant="contained">Save</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
