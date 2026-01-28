import { useState, useMemo, useCallback, useRef, memo } from 'react';
import { Box, Stack, IconButton, Typography, Button, Checkbox, Paper } from '@mui/material';
import { ArrowBack, Close, CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Snapshot, PV, Severity, AnyEpicsType } from '../types';

interface SnapshotComparisonPageProps {
  mainSnapshot: Snapshot;
  comparisonSnapshot: Snapshot;
  onBack: () => void;
}

interface ComparisonRow {
  pv: PV;
  mainSetpoint: AnyEpicsType | undefined;
  compSetpoint: AnyEpicsType | undefined;
  mainReadback: AnyEpicsType | undefined;
  compReadback: AnyEpicsType | undefined;
  isSetpointDifferent: boolean;
  isReadbackDifferent: boolean;
}

const formatValue = (value: AnyEpicsType | undefined): string => {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'number') return value.toFixed(3);
  return String(value);
};

const SeverityIcon = memo(({ severity }: { severity?: Severity }) => {
  switch (severity) {
    case Severity.NO_ALARM:
      return <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />;
    case Severity.MINOR:
      return <Warning fontSize="small" sx={{ color: 'warning.main' }} />;
    case Severity.MAJOR:
    case Severity.INVALID:
      return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
    default:
      return <Typography variant="body2">--</Typography>;
  }
});

SeverityIcon.displayName = 'SeverityIcon';

// Column widths
const COL_WIDTHS = {
  checkbox: 50,
  severity: 70,
  device: 100,
  pvName: 200,
  value: 130,
};

const TOTAL_WIDTH =
  COL_WIDTHS.checkbox +
  COL_WIDTHS.severity +
  COL_WIDTHS.device +
  COL_WIDTHS.pvName +
  COL_WIDTHS.value * 4;

export function SnapshotComparisonPage({
  mainSnapshot,
  comparisonSnapshot,
  onBack,
}: SnapshotComparisonPageProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (date: Date) =>
    date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  // Build comparison data - match PVs by uuid (pv_id)
  const comparisonData = useMemo(() => {
    const rows: ComparisonRow[] = [];
    const compPVMap = new Map(comparisonSnapshot.pvs.map((pv) => [pv.uuid, pv]));

    mainSnapshot.pvs.forEach((mainPV) => {
      const compPV = compPVMap.get(mainPV.uuid);
      const mainSetpoint = mainPV.setpoint_data?.data;
      const compSetpoint = compPV?.setpoint_data?.data;
      const mainReadback = mainPV.readback_data?.data;
      const compReadback = compPV?.readback_data?.data;
      const isSetpointDifferent = mainSetpoint !== compSetpoint;
      const isReadbackDifferent = mainReadback !== compReadback;

      rows.push({
        pv: mainPV,
        mainSetpoint,
        compSetpoint,
        mainReadback,
        compReadback,
        isSetpointDifferent,
        isReadbackDifferent,
      });
    });

    return rows;
  }, [mainSnapshot, comparisonSnapshot]);

  const virtualizer = useVirtualizer({
    count: comparisonData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 41,
    overscan: 20,
  });

  const handleCheckboxChange = useCallback((pvUuid: string) => {
    setSelectedRows((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(pvUuid)) {
        newSelected.delete(pvUuid);
      } else {
        newSelected.add(pvUuid);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === comparisonData.length) {
        return new Set();
      }
      return new Set(comparisonData.map((row) => row.pv.uuid));
    });
  }, [comparisonData]);

  const isAllSelected = selectedRows.size === comparisonData.length && comparisonData.length > 0;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < comparisonData.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', p: 2 }}>
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        {/* Header with both snapshot names like "X, Y" */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <IconButton onClick={onBack} aria-label="Go back" size="medium" edge="start">
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            {mainSnapshot.title}
          </Typography>
          <Typography variant="h5" color="text.secondary">
            ,
          </Typography>
          <Typography variant="h5" fontWeight={600} color="primary">
            {comparisonSnapshot.title}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<Close />} onClick={onBack} size="medium">
            Remove Comparison
          </Button>
        </Stack>

        {/* Timestamps row */}
        <Stack direction="row" spacing={4} sx={{ ml: 6 }}>
          <Typography variant="body2" color="text.secondary">
            {mainSnapshot.title}: {formatTimestamp(mainSnapshot.creation_time)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {comparisonSnapshot.title}: {formatTimestamp(comparisonSnapshot.creation_time)}
          </Typography>
        </Stack>
      </Box>

      <Paper
        ref={parentRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        {/* Sticky header */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            minWidth: TOTAL_WIDTH,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: COL_WIDTHS.checkbox, minWidth: COL_WIDTHS.checkbox, px: 1, py: 1 }}>
              <Checkbox
                size="small"
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleSelectAll}
              />
            </Box>
            <Box
              sx={{
                width: COL_WIDTHS.severity,
                minWidth: COL_WIDTHS.severity,
                px: 1,
                py: 1,
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              Severity
            </Box>
            <Box
              sx={{
                width: COL_WIDTHS.device,
                minWidth: COL_WIDTHS.device,
                px: 1,
                py: 1,
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              Device
            </Box>
            <Box
              sx={{
                width: COL_WIDTHS.pvName,
                minWidth: COL_WIDTHS.pvName,
                px: 1,
                py: 1,
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              PV Name
            </Box>
            <Box
              sx={{
                width: COL_WIDTHS.value,
                minWidth: COL_WIDTHS.value,
                px: 1,
                py: 1,
                fontWeight: 'bold',
                fontSize: '0.875rem',
                textAlign: 'right',
              }}
            >
              {mainSnapshot.title} Setpoint
            </Box>
            <Box
              sx={{
                width: COL_WIDTHS.value,
                minWidth: COL_WIDTHS.value,
                px: 1,
                py: 1,
                fontWeight: 'bold',
                fontSize: '0.875rem',
                textAlign: 'right',
              }}
            >
              {comparisonSnapshot.title} Setpoint
            </Box>
            <Box
              sx={{
                width: COL_WIDTHS.value,
                minWidth: COL_WIDTHS.value,
                px: 1,
                py: 1,
                fontWeight: 'bold',
                fontSize: '0.875rem',
                textAlign: 'right',
              }}
            >
              {mainSnapshot.title} Readback
            </Box>
            <Box
              sx={{
                width: COL_WIDTHS.value,
                minWidth: COL_WIDTHS.value,
                px: 1,
                py: 1,
                fontWeight: 'bold',
                fontSize: '0.875rem',
                textAlign: 'right',
              }}
            >
              {comparisonSnapshot.title} Readback
            </Box>
          </Box>
        </Box>

        {/* Virtualized body */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            minWidth: TOTAL_WIDTH,
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = comparisonData[virtualRow.index];
            const hasDifference = row.isSetpointDifferent || row.isReadbackDifferent;
            const isSelected = selectedRows.has(row.pv.uuid);

            return (
              <Box
                key={row.pv.uuid}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  minWidth: TOTAL_WIDTH,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: hasDifference ? 'rgba(255, 167, 38, 0.15)' : 'inherit',
                  '&:hover': {
                    bgcolor: hasDifference ? 'rgba(255, 167, 38, 0.25)' : 'action.hover',
                  },
                }}
              >
                <Box sx={{ width: COL_WIDTHS.checkbox, minWidth: COL_WIDTHS.checkbox, px: 1 }}>
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={() => handleCheckboxChange(row.pv.uuid)}
                  />
                </Box>
                <Box
                  sx={{
                    width: COL_WIDTHS.severity,
                    minWidth: COL_WIDTHS.severity,
                    px: 1,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <SeverityIcon severity={row.pv.setpoint_data?.severity} />
                </Box>
                <Box
                  sx={{
                    width: COL_WIDTHS.device,
                    minWidth: COL_WIDTHS.device,
                    px: 1,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.pv.device}
                </Box>
                <Box
                  sx={{
                    width: COL_WIDTHS.pvName,
                    minWidth: COL_WIDTHS.pvName,
                    px: 1,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.pv.setpoint}
                </Box>
                <Box
                  sx={{
                    width: COL_WIDTHS.value,
                    minWidth: COL_WIDTHS.value,
                    px: 1,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    textAlign: 'right',
                    bgcolor: row.isSetpointDifferent ? 'error.light' : 'transparent',
                  }}
                >
                  {formatValue(row.mainSetpoint)}
                </Box>
                <Box
                  sx={{
                    width: COL_WIDTHS.value,
                    minWidth: COL_WIDTHS.value,
                    px: 1,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    textAlign: 'right',
                    bgcolor: row.isSetpointDifferent ? 'error.light' : 'transparent',
                  }}
                >
                  {formatValue(row.compSetpoint)}
                </Box>
                <Box
                  sx={{
                    width: COL_WIDTHS.value,
                    minWidth: COL_WIDTHS.value,
                    px: 1,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    textAlign: 'right',
                    bgcolor: row.isReadbackDifferent ? 'info.light' : 'transparent',
                  }}
                >
                  {formatValue(row.mainReadback)}
                </Box>
                <Box
                  sx={{
                    width: COL_WIDTHS.value,
                    minWidth: COL_WIDTHS.value,
                    px: 1,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    textAlign: 'right',
                    bgcolor: row.isReadbackDifferent ? 'info.light' : 'transparent',
                  }}
                >
                  {formatValue(row.compReadback)}
                </Box>
              </Box>
            );
          })}
        </div>
      </Paper>
    </Box>
  );
}
