import { useCallback, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { SnapshotDetailsPage } from '../pages';
import { Snapshot, PV, Severity, Status } from '../types';
import { useSnapshot, snapshotKeys } from '../hooks';
import { SnapshotDTO, PVValueDTO } from '../types/api';

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
  // Debug: log first PV values to see structure
  if (dto.pvValues.length > 0) {
    console.log('[Snapshot] First PV value from backend:', dto.pvValues[0]);
    // Find a PV with setpoint value for debugging
    const withSetpoint = dto.pvValues.find((pv) => pv.setpointValue !== null);
    const withReadback = dto.pvValues.find((pv) => pv.readbackValue !== null);
    if (withSetpoint) {
      console.log(
        '[Snapshot] Sample PV with setpoint:',
        withSetpoint.pvName,
        withSetpoint.setpointValue
      );
    }
    if (withReadback) {
      console.log(
        '[Snapshot] Sample PV with readback:',
        withReadback.pvName,
        withReadback.readbackValue
      );
    }
    // Count how many have values
    const setpointCount = dto.pvValues.filter((pv) => pv.setpointValue !== null).length;
    const readbackCount = dto.pvValues.filter((pv) => pv.readbackValue !== null).length;
    console.log(
      `[Snapshot] Values: ${setpointCount} with setpoint, ${readbackCount} with readback out of ${dto.pvValues.length} total`
    );
  }

  const pvs: PV[] = dto.pvValues.map((pvValue: PVValueDTO) => {
    const setpoint = pvValue.setpointValue;
    const readback = pvValue.readbackValue;
    // Use actual addresses from backend, fallback to pvName for setpoint
    const setpointAddr = pvValue.setpointName || pvValue.pvName;
    const readbackAddr = pvValue.readbackName || null;

    // Convert tags array to {groupName: {tagId: tagName}} format for filtering
    const tagsMap: Record<string, Record<string, string>> = {};
    if (pvValue.tags) {
      pvValue.tags.forEach((tag) => {
        if (!tagsMap[tag.groupName]) {
          tagsMap[tag.groupName] = {};
        }
        tagsMap[tag.groupName][tag.id] = tag.name;
      });
    }

    return {
      uuid: pvValue.pvId,
      description: '',
      setpoint: setpointAddr,
      readback: readbackAddr || '', // Empty string if no readback address
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
      tags: tagsMap,
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

function SnapshotDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const { id } = Route.useSearch();

  // Fetch all PVs (no pagination)
  const { data: snapshotDTO, isLoading, error } = useSnapshot(id || '');

  const handleBack = useCallback(async () => {
    // Refetch the snapshots list before navigating back to ensure new snapshots are visible
    await queryClient.refetchQueries({ queryKey: snapshotKeys.lists() });
    navigate({ to: '/snapshots' });
  }, [navigate, queryClient]);

  const handleRestore = useCallback((pvs: PV[]) => {
    console.log('Restoring PVs:', pvs);
    alert(`Restoring ${pvs.length} PV(s) - This feature is not yet implemented`);
  }, []);

  const handleCompare = useCallback(
    (comparisonSnapshotId: string) => {
      navigate({
        to: '/comparison',
        search: { mainId: id, compId: comparisonSnapshotId },
      });
    },
    [navigate, id]
  );

  // Memoize the snapshot transformation
  const snapshot = useMemo(() => {
    if (!snapshotDTO) return null;
    return mapSnapshotDTOtoSnapshot(snapshotDTO);
  }, [snapshotDTO]);

  if (!id) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
        }}
      >
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !snapshot) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
        }}
      >
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
    />
  );
}

export const Route = createFileRoute('/snapshot-details')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    id: search.id as string | undefined,
  }),
  component: SnapshotDetails,
});
