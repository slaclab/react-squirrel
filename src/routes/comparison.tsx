import { useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { SnapshotComparisonPage } from '../pages';
import { Snapshot, PV, Severity, Status } from '../types';
import { useSnapshot } from '../hooks';
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
  const pvs: PV[] = dto.pvValues.map((pvValue: PVValueDTO) => {
    const setpoint = pvValue.setpointValue;
    const readback = pvValue.readbackValue;
    const setpointAddr = pvValue.setpointName || pvValue.pvName;
    const readbackAddr = pvValue.readbackName || null;

    // Convert tags array to {groupName: {tagId: tagName}} format
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
      readback: readbackAddr || '',
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
  mainId?: string;
  compId?: string;
}

export const Route = createFileRoute('/comparison')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      mainId: search.mainId as string | undefined,
      compId: search.compId as string | undefined,
    };
  },
  component: Comparison,
});

function Comparison() {
  const navigate = useNavigate();
  const { mainId, compId } = Route.useSearch();

  // Fetch both snapshots
  const {
    data: mainSnapshotDTO,
    isLoading: loadingMain,
    error: errorMain,
  } = useSnapshot(mainId || '');
  const {
    data: compSnapshotDTO,
    isLoading: loadingComp,
    error: errorComp,
  } = useSnapshot(compId || '');

  const handleBack = () => {
    if (mainId) {
      navigate({ to: '/snapshot-details', search: { id: mainId } });
    } else {
      navigate({ to: '/snapshots' });
    }
  };

  // Transform DTOs to Snapshot objects
  const mainSnapshot = useMemo(() => {
    if (!mainSnapshotDTO) return null;
    return mapSnapshotDTOtoSnapshot(mainSnapshotDTO);
  }, [mainSnapshotDTO]);

  const comparisonSnapshot = useMemo(() => {
    if (!compSnapshotDTO) return null;
    return mapSnapshotDTOtoSnapshot(compSnapshotDTO);
  }, [compSnapshotDTO]);

  if (!mainId || !compId) {
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
          Missing snapshot IDs for comparison
        </Typography>
        <Button variant="contained" onClick={() => navigate({ to: '/snapshots' })}>
          Back to Snapshots
        </Button>
      </Box>
    );
  }

  if (loadingMain || loadingComp) {
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

  if (errorMain || errorComp || !mainSnapshot || !comparisonSnapshot) {
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
          {errorMain instanceof Error
            ? errorMain.message
            : errorComp instanceof Error
              ? errorComp.message
              : 'Failed to load snapshots'}
        </Typography>
        <Button variant="contained" onClick={handleBack}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <SnapshotComparisonPage
      mainSnapshot={mainSnapshot}
      comparisonSnapshot={comparisonSnapshot}
      onBack={handleBack}
    />
  );
}
