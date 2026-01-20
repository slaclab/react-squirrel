import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  ListItemText,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText as MuiListItemText,
} from '@mui/material';
import { Restore, Add } from '@mui/icons-material';
import { Snapshot, PV, AnyEpicsType } from '../types';
import { SnapshotHeader, SearchBar, PVTable } from '../components';
import { tagsService, snapshotService } from '../services';
import { SnapshotSummaryDTO } from '../types/api';

// Format EPICS value for display
const formatValue = (value: AnyEpicsType | undefined): string => {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'number') return value.toFixed(3);
  if (Array.isArray(value)) return `[${value.length} elements]`;
  return String(value);
};

interface SnapshotDetailsPageProps {
  snapshot: Snapshot | null;
  onBack: () => void;
  onRestore?: (pvs: PV[]) => void;
  onCompare?: (comparisonSnapshotId: string) => void;
}

export const SnapshotDetailsPage: React.FC<SnapshotDetailsPageProps> = ({
  snapshot,
  onBack,
  onRestore,
  onCompare,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedPVs, setSelectedPVs] = useState<PV[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [tagGroups, setTagGroups] = useState<
    Array<{ id: string; name: string; tags: Array<{ id: string; name: string }> }>
  >([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [availableSnapshots, setAvailableSnapshots] = useState<SnapshotSummaryDTO[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  // Fetch tag groups when component mounts
  useEffect(() => {
    const fetchTagGroups = async () => {
      try {
        const summaries = await tagsService.findAllTagGroups();
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

  // Get all available tag options from backend tag groups
  const tagGroupOptions = useMemo(() => {
    const result: Record<string, Array<{ id: string; name: string }>> = {};
    tagGroups.forEach((group) => {
      result[group.name] = group.tags || [];
    });
    return result;
  }, [tagGroups]);

  // Filter PVs based on active tag filters
  const filteredPVs = useMemo(() => {
    if (!snapshot) return [];
    let result = snapshot.pvs;

    Object.entries(activeFilters).forEach(([groupName, filterValues]) => {
      if (filterValues && filterValues.length > 0) {
        result = result.filter((pv) => {
          const pvTagValues = pv.tags[groupName] ? Object.values(pv.tags[groupName]) : [];
          return filterValues.some((filterValue) => pvTagValues.includes(filterValue));
        });
      }
    });

    return result;
  }, [snapshot, activeFilters]);

  // Check if any filters are active
  const hasActiveFilters = Object.values(activeFilters).some(
    (values) => values && values.length > 0
  );

  // Get PVs that will be restored
  const pvsToRestore = useMemo(() => {
    return selectedPVs.length > 0 ? selectedPVs : snapshot?.pvs || [];
  }, [selectedPVs, snapshot?.pvs]);

  const clearFilters = () => {
    setActiveFilters({});
  };

  const handleRestore = () => {
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (onRestore) {
      onRestore(pvsToRestore);
    }
    setShowRestoreDialog(false);
  };

  const handleCompare = async () => {
    setShowCompareDialog(true);
    setLoadingSnapshots(true);
    try {
      const snapshots = await snapshotService.findSnapshots();
      // Filter out the current snapshot from the list
      const otherSnapshots = snapshots.filter((s) => s.id !== snapshot?.uuid);
      setAvailableSnapshots(otherSnapshots);
    } catch (err) {
      console.error('Failed to fetch snapshots:', err);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  const handleSelectComparisonSnapshot = (comparisonSnapshotId: string) => {
    setShowCompareDialog(false);
    if (onCompare) {
      onCompare(comparisonSnapshotId);
    }
  };

  if (!snapshot) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="h6" color="text.secondary">
            Loading snapshot...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        p: 2,
      }}
    >
      <SnapshotHeader snapshot={snapshot} onBack={onBack} />

      <Stack direction="row" spacing={2} sx={{ mb: 1, flexShrink: 0 }} alignItems="center">
        <SearchBar value={searchText} onChange={setSearchText} placeholder="Search PVs..." />
        <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
          <Button variant="outlined" startIcon={<Restore />} onClick={handleRestore} size="medium">
            Restore
          </Button>
          <Button variant="outlined" startIcon={<Add />} onClick={handleCompare} size="medium">
            Compare
          </Button>
        </Box>
      </Stack>

      {/* Tag Filter Bar */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {hasActiveFilters && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontStyle: 'italic', mr: 1 }}
            >
              Filtering {snapshot.pvs.length} loaded PVs
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
                            '& .MuiChip-label': { px: 1.5 },
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
                              '& .MuiChip-label': { px: 1.5 },
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

      <Box
        sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <PVTable pvs={filteredPVs} searchFilter={searchText} onSelectionChange={setSelectedPVs} />
      </Box>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={showRestoreDialog}
        onClose={() => setShowRestoreDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPVs.length === 0
            ? `Restore all ${pvsToRestore.length} PVs?`
            : `Restore ${selectedPVs.length} selected PV${selectedPVs.length > 1 ? 's' : ''}?`}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {/* Table Header */}
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              backgroundColor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              px: 2,
              py: 1,
            }}
          >
            <Box sx={{ flex: 2, fontWeight: 'bold', fontSize: '0.875rem' }}>PV Name</Box>
            <Box sx={{ flex: 1, fontWeight: 'bold', fontSize: '0.875rem', textAlign: 'right' }}>
              Saved Setpoint
            </Box>
          </Box>

          {/* Table Body */}
          {pvsToRestore.map((pv) => (
            <Box
              key={pv.uuid}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box
                sx={{
                  flex: 2,
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={pv.setpoint}
              >
                {pv.setpoint}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  textAlign: 'right',
                }}
              >
                {formatValue(pv.setpoint_data?.data)}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRestoreDialog(false)}>Cancel</Button>
          <Button onClick={confirmRestore} variant="contained" color="primary">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Dialog - Snapshot Selection */}
      <Dialog
        open={showCompareDialog}
        onClose={() => setShowCompareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Snapshot to Compare</DialogTitle>
        <DialogContent dividers>
          {loadingSnapshots ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : availableSnapshots.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No other snapshots available for comparison
            </Typography>
          ) : (
            <List sx={{ pt: 0 }}>
              {availableSnapshots.map((snap) => (
                <ListItem key={snap.id} disablePadding>
                  <ListItemButton onClick={() => handleSelectComparisonSnapshot(snap.id)}>
                    <MuiListItemText
                      primary={snap.title}
                      secondary={`${new Date(snap.createdDate).toLocaleString()} • ${snap.pvCount || 0} PVs`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompareDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
