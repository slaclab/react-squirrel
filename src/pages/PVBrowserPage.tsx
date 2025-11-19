import React, { useState, useMemo, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Divider,
  Link,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Search, Add, Delete, Close, Upload } from '@mui/icons-material';
import { PV } from '../types';
import { tagsService } from '../services';
import { CSVImportDialog } from '../components/CSVImportDialog';
import { ParsedCSVRow } from '../utils/csvParser';

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
  onImportPVs?: (csvData: ParsedCSVRow[]) => Promise<void>;
  onDeletePV?: (pv: PV) => void;
  onPVClick?: (pv: PV) => void;
  isAdmin?: boolean;
  searchText?: string;
  onSearchChange?: (text: string) => void;
}

export const PVBrowserPage: React.FC<PVBrowserPageProps> = ({
  pvs,
  onAddPV,
  onImportPVs,
  onDeletePV,
  onPVClick,
  isAdmin = false,
  searchText = '',
  onSearchChange,
}) => {
  const [selectedPV, setSelectedPV] = useState<PV | null>(null);
  const [addPVDialogOpen, setAddPVDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [tagGroups, setTagGroups] = useState<Array<{ id: string; name: string; tags: Array<{ id: string; name: string }> }>>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [newPVData, setNewPVData] = useState({
    pvName: '',
    readbackName: '',
    description: '',
    absTolerance: '',
    relTolerance: '',
    selectedTags: {} as Record<string, string[]>,
  });

  // Fetch tag groups when component mounts
  useEffect(() => {
    const fetchTagGroups = async () => {
      try {
        const summaries = await tagsService.findAllTagGroups();
        // Fetch detailed information for each tag group to get the tags
        const detailedGroups = await Promise.all(
          summaries.map(async (summary) => {
            try {
              const details = await tagsService.getTagGroupById(summary.id);
              const group = details[0];
              return {
                id: group.id,
                name: group.name,
                tags: group.tags,
              };
            } catch (err) {
              console.error(`Failed to fetch details for group ${summary.id}:`, err);
              return {
                id: summary.id,
                name: summary.name,
                tags: [],
              };
            }
          })
        );
        setTagGroups(detailedGroups);
      } catch (err) {
        console.error('Failed to fetch tag groups:', err);
      }
    };
    fetchTagGroups();
  }, []);

  // Get all available tag options from backend tag groups (not from PVs)
  const tagGroupOptions = useMemo(() => {
    const result: Record<string, Array<{ id: string; name: string }>> = {};

    // Get all tags from each tag group
    tagGroups.forEach((group) => {
      result[group.name] = group.tags || [];
    });

    return result;
  }, [tagGroups]);

  const filteredPVs = useMemo(() => {
    let result = pvs;

    // Search is now handled server-side, so we only apply tag filters here
    // Apply tag group filters dynamically
    Object.entries(activeFilters).forEach(([groupName, filterValues]) => {
      if (filterValues && filterValues.length > 0) {
        result = result.filter((pv) => {
          const pvTagValues = pv.tags[groupName] ? Object.values(pv.tags[groupName]) : [];
          // PV must have at least one of the selected tags
          return filterValues.some(filterValue => pvTagValues.includes(filterValue));
        });
      }
    });

    return result;
  }, [pvs, activeFilters]);

  // Check if any filters are active
  const hasActiveFilters = Object.values(activeFilters).some((values) => values && values.length > 0);

  const clearFilters = () => {
    setActiveFilters({});
  };

  const handleRowClick = (pv: PV) => {
    setSelectedPV(pv);
    if (onPVClick) onPVClick(pv);
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
          {hasActiveFilters && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', mr: 1 }}>
              Filtering {pvs.length} loaded PVs
            </Typography>
          )}
          {tagGroups.map((group) => {
            const options = tagGroupOptions[group.name] || [];
            const selectedValues = activeFilters[group.name] || [];

            return (
              <FormControl key={group.id} size="small" sx={{ minWidth: 'auto' }}>
                <Select
                  multiple
                  value={selectedValues}
                  onChange={(e) => {
                    const value = e.target.value;
                    setActiveFilters({
                      ...activeFilters,
                      [group.name]: typeof value === 'string' ? value.split(',') : value,
                    });
                  }}
                  displayEmpty
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return (
                        <Chip
                          label={group.name}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderRadius: '16px',
                            height: '24px',
                            '& .MuiChip-label': { px: 1.5 }
                          }}
                        />
                      );
                    }
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={
                              <span>
                                {group.name} | <span style={{ color: '#1976d2' }}>{value}</span>
                              </span>
                            }
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: '16px',
                              height: '24px',
                              '& .MuiChip-label': { px: 1.5 }
                            }}
                          />
                        ))}
                      </Box>
                    );
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-select': {
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    },
                  }}
                >
                  {options.map((tag) => (
                    <MenuItem key={tag.id} value={tag.name}>
                      <Checkbox checked={selectedValues.indexOf(tag.name) > -1} />
                      <ListItemText primary={tag.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
        </Stack>
      </Box>

      {/* Table */}
      <Box sx={{ flex: 1, px: 2, pb: 2, overflow: 'hidden', display: 'flex' }}>
        <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
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
              {filteredPVs.map((pv) => (
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
            </TableBody>
          </Table>
          {filteredPVs.length === 0 && (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {searchText || hasActiveFilters ? 'No PVs match your search or filters' : 'No PVs available'}
              </Typography>
              {hasActiveFilters && pvs.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Tag filters are applied to {pvs.length} loaded PV{pvs.length === 1 ? '' : 's'}. Try clearing filters or loading more PVs.
                </Typography>
              )}
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
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">PV Details</Typography>
              <IconButton size="small" onClick={() => setSelectedPV(null)}>
                <Close />
              </IconButton>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  PV Name
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {selectedPV.setpoint}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Readback Name
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {selectedPV.readback}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedPV.description || 'No description'}
                </Typography>
              </Box>

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
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* Add PV Dialog */}
      <Dialog open={addPVDialogOpen} onClose={() => setAddPVDialogOpen(false)} maxWidth="sm" fullWidth>
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
                {tagGroups.map((group) => {
                  const selectedValues = newPVData.selectedTags[group.name] || [];

                  return (
                    <FormControl key={group.id} size="small" sx={{ minWidth: 'auto' }}>
                      <Select
                        multiple
                        value={selectedValues}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewPVData({
                            ...newPVData,
                            selectedTags: {
                              ...newPVData.selectedTags,
                              [group.name]: typeof value === 'string' ? value.split(',') : value,
                            },
                          });
                        }}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return (
                              <Chip
                                label={group.name}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderRadius: '16px',
                                  height: '24px',
                                  '& .MuiChip-label': { px: 1.5 }
                                }}
                              />
                            );
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((tagId) => {
                                const tag = group.tags.find(t => t.id === tagId);
                                return tag ? (
                                  <Chip
                                    key={tagId}
                                    label={
                                      <span>
                                        {group.name} | <span style={{ color: '#1976d2' }}>{tag.name}</span>
                                      </span>
                                    }
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderRadius: '16px',
                                      height: '24px',
                                      '& .MuiChip-label': { px: 1.5 }
                                    }}
                                  />
                                ) : null;
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          '& .MuiSelect-select': {
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                          },
                        }}
                      >
                        {group.tags.map((tag) => (
                          <MenuItem key={tag.id} value={tag.id}>
                            <Checkbox checked={selectedValues.indexOf(tag.id) > -1} />
                            <ListItemText primary={tag.name} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                })}
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
