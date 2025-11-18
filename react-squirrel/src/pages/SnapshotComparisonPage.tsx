import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  IconButton,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
} from '@mui/material';
import { ArrowBack, Close, CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { Snapshot, PV, Severity } from '../types';

interface SnapshotComparisonPageProps {
  mainSnapshot: Snapshot;
  comparisonSnapshot: Snapshot;
  onBack: () => void;
}

interface ComparisonRow {
  pv: PV;
  mainValue: string | number | undefined;
  compValue: string | number | undefined;
  isDifferent: boolean;
}

const getSeverityIcon = (severity?: Severity): React.ReactNode => {
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
};

export const SnapshotComparisonPage: React.FC<SnapshotComparisonPageProps> = ({
  mainSnapshot,
  comparisonSnapshot,
  onBack,
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') return value.toFixed(3);
    return String(value);
  };

  // Build comparison data
  const comparisonData = useMemo(() => {
    const rows: ComparisonRow[] = [];
    const compPVMap = new Map(comparisonSnapshot.pvs.map((pv) => [pv.setpoint, pv]));

    mainSnapshot.pvs.forEach((mainPV) => {
      const compPV = compPVMap.get(mainPV.setpoint);
      const mainValue = mainPV.setpoint_data.data;
      const compValue = compPV?.setpoint_data.data;
      const isDifferent = mainValue !== compValue;

      rows.push({
        pv: mainPV,
        mainValue,
        compValue,
        isDifferent,
      });
    });

    return rows;
  }, [mainSnapshot, comparisonSnapshot]);

  const handleCheckboxChange = (pvUuid: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(pvUuid)) {
      newSelected.delete(pvUuid);
    } else {
      newSelected.add(pvUuid);
    }
    setSelectedRows(newSelected);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <IconButton onClick={onBack} aria-label="Go back" size="medium" edge="start">
            <ArrowBack />
          </IconButton>
          <Typography variant="body1" fontWeight={500}>
            Main Snapshot
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="bold">
            |
          </Typography>
          <Typography variant="body1" fontWeight={600} color="primary">
            {mainSnapshot.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="bold">
            |
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {formatTimestamp(mainSnapshot.creation_time)}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 40 }} /> {/* Spacer for alignment with back button */}
          <Typography variant="body1" fontWeight={500}>
            Comparison Snapshot
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="bold">
            |
          </Typography>
          <Typography variant="body1" fontWeight={600} color="primary">
            {comparisonSnapshot.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="bold">
            |
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ flex: 1 }}>
            {formatTimestamp(comparisonSnapshot.creation_time)}
          </Typography>
          <Button variant="outlined" startIcon={<Close />} onClick={onBack} size="medium">
            Remove Comparison
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox size="small" />
              </TableCell>
              <TableCell align="center" sx={{ width: 50 }}>
                Main
              </TableCell>
              <TableCell align="center" sx={{ width: 50 }}>
                Comp
              </TableCell>
              <TableCell sx={{ width: 120 }}>Device</TableCell>
              <TableCell sx={{ minWidth: 200, fontFamily: 'monospace' }}>PV Name</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>
                Main Value
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>
                Comparison Value
              </TableCell>
              <TableCell align="center" sx={{ width: 80 }}>
                Diff
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comparisonData.map((row) => (
              <TableRow
                key={row.pv.uuid}
                hover
                sx={{
                  bgcolor: row.isDifferent ? 'warning.light' : 'inherit',
                  '&:hover': {
                    bgcolor: row.isDifferent ? 'warning.main' : 'action.hover',
                  },
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRows.has(row.pv.uuid)}
                    onChange={() => handleCheckboxChange(row.pv.uuid)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">{getSeverityIcon(row.pv.setpoint_data.severity)}</TableCell>
                <TableCell align="center">{getSeverityIcon(Severity.NO_ALARM)}</TableCell>
                <TableCell>{row.pv.device}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{row.pv.setpoint}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatValue(row.mainValue)}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {formatValue(row.compValue)}
                </TableCell>
                <TableCell align="center">
                  {row.isDifferent && (
                    <Typography variant="body2" color="error" fontWeight="bold">
                      ✗
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
