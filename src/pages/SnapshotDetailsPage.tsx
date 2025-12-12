import React, { useState } from 'react';
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
  Pagination,
  Chip,
} from '@mui/material';
import { Restore, Add } from '@mui/icons-material';
import { Snapshot, PV } from '../types';
import { SnapshotHeader, SearchBar, PVTable } from '../components';

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

interface SnapshotDetailsPageProps {
  snapshot: Snapshot | null;
  onBack: () => void;
  onRestore?: (pvs: PV[]) => void;
  onCompare?: (snapshot: Snapshot, comparisonSnapshot: Snapshot) => void;
  pagination?: PaginationInfo;
}

export const SnapshotDetailsPage: React.FC<SnapshotDetailsPageProps> = ({
  snapshot,
  onBack,
  onRestore,
  onCompare: _onCompare,
  pagination,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedPVs, setSelectedPVs] = useState<PV[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  const handleRestore = () => {
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (onRestore) {
      // If no PVs selected, restore all
      const pvsToRestore = selectedPVs.length > 0 ? selectedPVs : snapshot?.pvs || [];
      onRestore(pvsToRestore);
    }
    setShowRestoreDialog(false);
  };

  const handleCompare = () => {
    setShowCompareDialog(true);
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

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexShrink: 0 }} alignItems="center">
        <SearchBar value={searchText} onChange={setSearchText} placeholder="Search PVs..." />
        <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<Restore />}
            onClick={handleRestore}
            size="medium"
          >
            Restore
          </Button>
          <Button variant="outlined" startIcon={<Add />} onClick={handleCompare} size="medium">
            Compare
          </Button>
        </Box>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PVTable
          pvs={snapshot.pvs}
          searchFilter={searchText}
          onSelectionChange={setSelectedPVs}
          isLoading={pagination?.isLoading}
        />

        {pagination && pagination.totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1.5,
              px: 2,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              flexShrink: 0,
            }}
          >
            <Chip
              label={`${pagination.totalCount.toLocaleString()} PVs total`}
              size="small"
              variant="outlined"
            />
            <Pagination
              count={pagination.totalPages}
              page={pagination.page + 1}
              onChange={(_, newPage) => pagination.onPageChange(newPage - 1)}
              color="primary"
              showFirstButton
              showLastButton
              disabled={pagination.isLoading}
            />
            <Typography variant="body2" color="text.secondary">
              Page {pagination.page + 1} of {pagination.totalPages}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={showRestoreDialog}
        onClose={() => setShowRestoreDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedPVs.length === 0
            ? 'Restore all PVs?'
            : `Restore ${selectedPVs.length} selected PV${selectedPVs.length > 1 ? 's' : ''}?`}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setShowRestoreDialog(false)}>Cancel</Button>
          <Button onClick={confirmRestore} variant="contained" color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Dialog - Placeholder */}
      <Dialog
        open={showCompareDialog}
        onClose={() => setShowCompareDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Comparison Snapshot</DialogTitle>
        <DialogContent>
          <Typography>Comparison functionality will be implemented here.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
