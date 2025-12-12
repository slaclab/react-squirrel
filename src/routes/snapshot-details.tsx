import { useState, useCallback, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { SnapshotDetailsPage } from '../pages';
import { Snapshot, PV, Severity, Status } from '../types';
import { useSnapshot } from '../hooks';
import { SnapshotDTO, PVValueDTO } from '../types/api';

const PAGE_SIZE = 500;

// Map severity number from backend to Severity enum
const mapSeverity = (severity?: number): Severity => {
  switch (severity) {
    case 0:
      return Severity.NO_ALARM;
    case 1:
      return Severity.MINOR;
    case 2:
      return Severity.MAJOR;
    case 3:
      return Severity.INVALID;
    default:
      return Severity.INVALID;
  }
};

// Map status number from backend to Status enum
const mapStatus = (status?: number): Status => {
  if (status === undefined || status === 0) return Status.NO_ALARM;
  return Status.UDF;
};

// Convert SnapshotDTO from backend to Snapshot for UI
const mapSnapshotDTOtoSnapshot = (dto: SnapshotDTO): Snapshot => {
  const pvs: PV[] = dto.pvValues.map((pvValue: PVValueDTO) => {
    const setpoint = pvValue.setpointValue;
    const readback = pvValue.readbackValue;

    return {
      uuid: pvValue.pvId,
      description: '',
      setpoint: pvValue.pvName,
      readback: `${pvValue.pvName}:RBV`,
      config: '',
      setpoint_data: {
        data: setpoint?.value,
        status: mapStatus(setpoint?.status),
        severity: mapSeverity(setpoint?.severity),
        timestamp: setpoint?.timestamp ? new Date(setpoint.timestamp) : new Date(),
      },
      readback_data: {
        data: readback?.value,
        status: mapStatus(readback?.status),
        severity: mapSeverity(readback?.severity),
        timestamp: readback?.timestamp ? new Date(readback.timestamp) : new Date(),
      },
      config_data: {
        data: undefined,
        status: Status.UDF,
        severity: Severity.INVALID,
        timestamp: new Date(),
      },
      device: pvValue.pvName.split(':')[0] || 'Unknown',
      tags: {},
      creation_time: new Date(dto.createdDate),
    };
  });

  return {
    uuid: dto.id,
    title: dto.title,
    description: dto.comment || '',
    pvs,
    pvCount: dto.pvCount,
    creation_time: new Date(dto.createdDate),
  };
};

interface SearchParams {
  id?: string;
}

export const Route = createFileRoute('/snapshot-details')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      id: search.id as string | undefined,
    };
  },
  component: SnapshotDetails,
});

function SnapshotDetails() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const [page, setPage] = useState(0);

  // Use React Query for data fetching with pagination
  const { data: snapshotDTO, isLoading, error, isFetching } = useSnapshot(id || '', {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const handleBack = useCallback(() => {
    navigate({ to: '/snapshots' });
  }, [navigate]);

  const handleRestore = useCallback((pvs: PV[]) => {
    console.log('Restoring PVs:', pvs);
    alert(`Restoring ${pvs.length} PV(s) - This feature is not yet implemented`);
  }, []);

  const handleCompare = useCallback((currentSnapshot: Snapshot, comparisonSnapshot: Snapshot) => {
    console.log('Comparing snapshots:', currentSnapshot, comparisonSnapshot);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Memoize the snapshot transformation
  const snapshot = useMemo(() => {
    if (!snapshotDTO) return null;
    return mapSnapshotDTOtoSnapshot(snapshotDTO);
  }, [snapshotDTO]);

  // Calculate pagination info
  const totalCount = snapshotDTO?.pvCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (!id) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          No snapshot ID provided
        </Typography>
        <Button variant="contained" onClick={handleBack}>
          Back to Snapshots
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !snapshot) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error instanceof Error ? error.message : 'Snapshot not found'}
        </Typography>
        <Button variant="contained" onClick={handleBack}>
          Back to Snapshots
        </Button>
      </Box>
    );
  }

  return (
    <SnapshotDetailsPage
      snapshot={snapshot}
      onBack={handleBack}
      onRestore={handleRestore}
      onCompare={handleCompare}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages,
        onPageChange: handlePageChange,
        isLoading: isFetching,
      }}
    />
  );
}
