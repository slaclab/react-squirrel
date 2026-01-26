import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Stack,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Divider,
  Link,
  CircularProgress,
} from '@mui/material';
import { Search, Add, Delete, Close, Upload } from '@mui/icons-material';
import { PV } from '../types';
import { CSVImportDialog } from '../components/CSVImportDialog';
import { TagGroupSelect } from '../components/TagGroupSelect';
import { ParsedCSVRow } from '../utils/csvParser';

interface TagGroupInfo {
  id: string;
  name: string;
  tags: Array<{ id: string; name: string }>;
}

interface PVBrowserPageProps {
  pvs: PV[];
  onAddPV?: (pvData: {
    pvName: string;
    readbackName: string;
    description: string;
    absTolerance: string;
    relTolerance: string;
    selectedTags: Record<string, string[]>;
  }) => Promise<void>;
  onUpdatePV?: (
    pvId: string,
    updates: {
      description?: string;
      absTolerance?: number;
      relTolerance?: number;
      tags?: string[];
    }
  ) => Promise<void>;
  onImportPVs?: (csvData: ParsedCSVRow[]) => Promise<void>;
  onDeletePV?: (pv: PV) => void;
  onPVClick?: (pv: PV) => void;
  isAdmin?: boolean;
  searchText?: string;
  onSearchChange?: (text: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  tagGroups?: TagGroupInfo[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

export const PVBrowserPage: React.FC<PVBrowserPageProps> = ({
  pvs,
  onAddPV,
  onUpdatePV,
  onImportPVs,
  onDeletePV,
  onPVClick,
  isAdmin = false,
  searchText = '',
  onSearchChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  tagGroups = [],
  activeFilters = {},
  onFilterChange,
}) => {
  const [selectedPV, setSelectedPV] = useState<PV | null>(null);
  const [addPVDialogOpen, setAddPVDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newPVData, setNewPVData] = useState({
    pvName: '',
    readbackName: '',
    description: '',
    absTolerance: '',
    relTolerance: '',
    selectedTags: {} as Record<string, string[]>,
  });
  // Edit state for PV details drawer
  const [editPVData, setEditPVData] = useState({
    description: '',
    absTolerance: '',
    relTolerance: '',
    selectedTags: {} as Record<string, string[]>,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Refs for infinite scroll
  const sentinelRef = useRef<HTMLTableRowElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Effect for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const sentinel = sentinelRef.current;
    const container = tableContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: container,
        rootMargin: '100px', // Start loading 100px before reaching the bottom
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Check if any filters are active
  const hasActiveFilters = Object.values(activeFilters).some(
    (values) => values && values.length > 0
  );

  const clearFilters = () => {
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const handleFilterChange = (groupName: string, values: string[]) => {
    if (onFilterChange) {
      onFilterChange({
        ...activeFilters,
        [groupName]: values,
      });
    }
  };

  const handleRowClick = (pv: PV) => {
    setSelectedPV(pv);
    // Initialize edit state from selected PV, including current tags
    // Build selectedTags from the PV's tags structure
    // PV tags are structured as: { groupName: { tagName: tagName } }
    // We need to convert to: { groupName: [tagId, tagId, ...] }
    const initialSelectedTags: Record<string, string[]> = {};

    // For each tag group in the PV, find the corresponding tag IDs from tagGroups
    Object.entries(pv.tags).forEach(([groupName, tagSet]) => {
      if (typeof tagSet === 'object') {
        const tagNames = Object.values(tagSet).filter((t): t is string => typeof t === 'string');
        // Find the tag group and map tag names to IDs
        const group = tagGroups.find((g) => g.name === groupName);
        if (group) {
          const tagIds = tagNames
            .map((tagName) => group.tags.find((t) => t.name === tagName)?.id)
            .filter((id): id is string => id !== undefined);
          if (tagIds.length > 0) {
            initialSelectedTags[groupName] = tagIds;
          }
        }
      }
    });

    setEditPVData({
      description: pv.description || '',
      absTolerance: pv.abs_tolerance?.toString() || '',
      relTolerance: pv.rel_tolerance?.toString() || '',
      selectedTags: initialSelectedTags,
    });
    if (onPVClick) onPVClick(pv);
  };

  const handleUpdatePVSubmit = async () => {
    if (!selectedPV || !onUpdatePV) return;

    try {
      setIsSaving(true);
      const updates: {
        description?: string;
        absTolerance?: number;
        relTolerance?: number;
        tags?: string[];
      } = {};

      if (editPVData.description !== (selectedPV.description || '')) {
        updates.description = editPVData.description;
      }
      if (editPVData.absTolerance !== (selectedPV.abs_tolerance?.toString() || '')) {
        updates.absTolerance = editPVData.absTolerance
          ? parseFloat(editPVData.absTolerance)
          : undefined;
      }
      if (editPVData.relTolerance !== (selectedPV.rel_tolerance?.toString() || '')) {
        updates.relTolerance = editPVData.relTolerance
          ? parseFloat(editPVData.relTolerance)
          : undefined;
      }

      // Always send the current tag selection (to allow removing all tags too)
      const tagIds = Object.values(editPVData.selectedTags)
        .flat()
        .filter((id) => id !== '');
      updates.tags = tagIds;

      await onUpdatePV(selectedPV.uuid, updates);
      setSelectedPV(null); // Close drawer on success
    } catch (err) {
      console.error('Failed to update PV:', err);
      alert('Failed to update PV: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPVSubmit = async () => {
    if (!newPVData.pvName.trim()) {
      alert('PV Name is required');
      return;
    }

    // Check if readback name is the same as PV name
    if (newPVData.readbackName && newPVData.readbackName === newPVData.pvName) {
      alert('Readback Name must be different from PV Name');
      return;
    }

    try {
      if (onAddPV) {
        await onAddPV(newPVData);
      }
      // Close dialog and reset form on success
      setAddPVDialogOpen(false);
      setNewPVData({
        pvName: '',
        readbackName: '',
        description: '',
        absTolerance: '',
        relTolerance: '',
        selectedTags: {},
      });
    } catch (err) {
      console.error('Failed to add PV:', err);
      alert('Failed to add PV: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleImportPVs = async (csvData: ParsedCSVRow[]) => {
    if (onImportPVs) {
      await onImportPVs(csvData);
    }
  };

  // Extract unique tags for display
  const getTags = (pv: PV): string[] => {
    const tags: string[] = [];
    Object.values(pv.tags).forEach((tagSet: any) => {
      if (typeof tagSet === 'object') {
        tags.push(...Object.values(tagSet).filter((t): t is string => typeof t === 'string'));
      }
    });
    return tags;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Bar with Search and Add PV Button */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            value={searchText}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search PVs..."
            size="small"
            sx={{ maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            {isAdmin && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => setImportDialogOpen(true)}
                  size="medium"
                >
                  Import PVs
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setAddPVDialogOpen(true)}
                  size="medium"
                >
                  Add PV
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {tagGroups.map((group) => {
            const selectedValues = activeFilters[group.name] || [];

            return (
              <TagGroupSelect
                key={group.id}
                groupId={group.id}
                groupName={group.name}
                tags={group.tags}
                selectedValues={selectedValues}
                onChange={handleFilterChange}
                useIds={false}
              />
            );
          })}

          {hasActiveFilters && (
            <Link
              component="button"
              variant="body2"
              onClick={clearFilters}
              sx={{ ml: 1, cursor: 'pointer', textDecoration: 'none', color: 'primary.main' }}
            >
              x Clear Filters
            </Link>
          )}
          {hasActiveFilters && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontStyle: 'italic', ml: 1 }}
            >
              Filtering {pvs.length} loaded PVs
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Table */}
      <Box sx={{ flex: 1, px: 2, pb: 2, overflow: 'hidden', display: 'flex' }}>
        <TableContainer
          component={Paper}
          sx={{ flex: 1, overflow: 'auto' }}
          ref={tableContainerRef}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 120 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Device
                  </Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 200, fontFamily: 'monospace' }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    PV Name
                  </Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Description
                  </Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Tags
                  </Typography>
                </TableCell>
                {isAdmin && onDeletePV && (
                  <TableCell align="center" sx={{ width: 60 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Actions
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {pvs.map((pv) => (
                <TableRow
                  key={pv.uuid}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(pv)}
                >
                  <TableCell>{pv.device}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{pv.setpoint}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {pv.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {getTags(pv).map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  {isAdmin && onDeletePV && (
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePV(pv);
                        }}
                        aria-label="Delete PV"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Sentinel row for infinite scroll */}
              <TableRow ref={sentinelRef} sx={{ visibility: hasMore ? 'visible' : 'collapse' }}>
                <TableCell
                  colSpan={isAdmin && onDeletePV ? 5 : 4}
                  sx={{
                    textAlign: 'center',
                    py: hasMore ? 2 : 0,
                    border: hasMore ? undefined : 'none',
                  }}
                >
                  {isLoadingMore && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">
                        Loading more PVs...
                      </Typography>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
              {/* End of list indicator */}
              {!hasMore && pvs.length > 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin && onDeletePV ? 5 : 4}
                    sx={{ textAlign: 'center', py: 2 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      All {pvs.length} PVs loaded
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {pvs.length === 0 && !isLoadingMore && (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {searchText || hasActiveFilters
                  ? 'No PVs match your search or filters'
                  : 'No PVs available'}
              </Typography>
            </Box>
          )}
        </TableContainer>
      </Box>

      {/* Details Drawer */}
      <Drawer
        anchor="right"
        open={selectedPV !== null}
        onClose={() => setSelectedPV(null)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            p: 3,
          },
        }}
      >
        {selectedPV && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">PV Details</Typography>
              <IconButton size="small" onClick={() => setSelectedPV(null)}>
                <Close />
              </IconButton>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2} sx={{ flex: 1 }}>
              {/* PV Name - always read-only */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  PV Name
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {selectedPV.setpoint}
                </Typography>
              </Box>

              {/* Readback Name - always read-only */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Readback Name
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {selectedPV.readback}
                </Typography>
              </Box>

              {/* Description - editable in admin mode */}
              {isAdmin ? (
                <TextField
                  label="Description"
                  value={editPVData.description}
                  onChange={(e) => setEditPVData({ ...editPVData, description: e.target.value })}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedPV.description || 'No description'}
                  </Typography>
                </Box>
              )}

              {/* Tolerance - editable in admin mode */}
              {isAdmin ? (
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Absolute Tolerance"
                    value={editPVData.absTolerance}
                    onChange={(e) => setEditPVData({ ...editPVData, absTolerance: e.target.value })}
                    fullWidth
                    size="small"
                    type="number"
                  />
                  <TextField
                    label="Relative Tolerance"
                    value={editPVData.relTolerance}
                    onChange={(e) => setEditPVData({ ...editPVData, relTolerance: e.target.value })}
                    fullWidth
                    size="small"
                    type="number"
                  />
                </Stack>
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tolerance
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Absolute: {selectedPV.abs_tolerance ?? 'N/A'}
                    <br />
                    Relative: {selectedPV.rel_tolerance ?? 'N/A'}
                  </Typography>
                </Box>
              )}

              {/* Tags - editable in admin mode */}
              {isAdmin ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Tags
                  </Typography>
                  <Stack direction="column" spacing={1}>
                    {tagGroups.map((group) => (
                      <TagGroupSelect
                        key={group.id}
                        groupId={group.id}
                        groupName={group.name}
                        tags={group.tags}
                        selectedValues={editPVData.selectedTags[group.name] || []}
                        onChange={(groupName, selectedIds) => {
                          setEditPVData({
                            ...editPVData,
                            selectedTags: {
                              ...editPVData.selectedTags,
                              [groupName]: selectedIds,
                            },
                          });
                        }}
                        useIds={true}
                      />
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {getTags(selectedPV).map((tag, idx) => (
                      <Chip key={idx} label={tag} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>

            {/* Save button - only shown in admin mode */}
            {isAdmin && onUpdatePV && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button onClick={() => setSelectedPV(null)}>Cancel</Button>
                  <Button variant="contained" onClick={handleUpdatePVSubmit} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      {/* Add PV Dialog */}
      <Dialog
        open={addPVDialogOpen}
        onClose={() => setAddPVDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create a New PV</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="PV Name"
              value={newPVData.pvName}
              onChange={(e) => setNewPVData({ ...newPVData, pvName: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Readback Name"
              value={newPVData.readbackName}
              onChange={(e) => setNewPVData({ ...newPVData, readbackName: e.target.value })}
              fullWidth
              size="small"
              error={!!(newPVData.readbackName && newPVData.readbackName === newPVData.pvName)}
              helperText={
                newPVData.readbackName && newPVData.readbackName === newPVData.pvName
                  ? 'Readback Name must be different from PV Name'
                  : ''
              }
            />
            <TextField
              label="Description"
              value={newPVData.description}
              onChange={(e) => setNewPVData({ ...newPVData, description: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Absolute Tolerance"
                value={newPVData.absTolerance}
                onChange={(e) => setNewPVData({ ...newPVData, absTolerance: e.target.value })}
                fullWidth
                size="small"
                type="number"
              />
              <TextField
                label="Relative Tolerance"
                value={newPVData.relTolerance}
                onChange={(e) => setNewPVData({ ...newPVData, relTolerance: e.target.value })}
                fullWidth
                size="small"
                type="number"
              />
            </Stack>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Tags
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {tagGroups.map((group) => (
                  <TagGroupSelect
                    key={group.id}
                    groupId={group.id}
                    groupName={group.name}
                    tags={group.tags}
                    selectedValues={newPVData.selectedTags[group.name] || []}
                    onChange={(groupName, selectedIds) => {
                      setNewPVData({
                        ...newPVData,
                        selectedTags: {
                          ...newPVData.selectedTags,
                          [groupName]: selectedIds,
                        },
                      });
                    }}
                    useIds={true}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPVDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPVSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportPVs}
        availableTagGroups={tagGroups}
      />
    </Box>
  );
};
