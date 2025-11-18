import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Cancel,
} from '@mui/icons-material';
import { PV, PVHeader, PV_HEADER_STRINGS, Severity } from '../types';

interface PVTableProps {
  pvs: PV[];
  searchFilter: string;
  onSelectionChange?: (selectedPVs: PV[]) => void;
}

const getSeverityIcon = (severity?: Severity): React.ReactNode => {
  switch (severity) {
    case Severity.NO_ALARM:
      return <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />;
    case Severity.MINOR:
      return <Warning fontSize="small" sx={{ color: 'warning.main' }} />;
    case Severity.MAJOR:
      return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
    case Severity.INVALID:
      return <Cancel fontSize="small" sx={{ color: 'text.disabled' }} />;
    default:
      return <Typography variant="body2">--</Typography>;
  }
};

export const PVTable: React.FC<PVTableProps> = ({ pvs, searchFilter, onSelectionChange }) => {
  const [selectedPVs, setSelectedPVs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Filter PVs based on search
  const filteredPVs = useMemo(() => {
    if (!searchFilter) return pvs;

    const lowerFilter = searchFilter.toLowerCase();
    return pvs.filter(pv =>
      pv.setpoint.toLowerCase().includes(lowerFilter) ||
      pv.device.toLowerCase().includes(lowerFilter) ||
      pv.description.toLowerCase().includes(lowerFilter)
    );
  }, [pvs, searchFilter]);

  const handleCheckboxChange = (pvUuid: string) => {
    const newSelected = new Set(selectedPVs);
    if (newSelected.has(pvUuid)) {
      newSelected.delete(pvUuid);
    } else {
      newSelected.add(pvUuid);
    }
    setSelectedPVs(newSelected);

    if (onSelectionChange) {
      const selected = pvs.filter(pv => newSelected.has(pv.uuid));
      onSelectionChange(selected);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPVs(new Set());
      onSelectionChange?.([]);
    } else {
      const allUuids = new Set(filteredPVs.map(pv => pv.uuid));
      setSelectedPVs(allUuids);
      onSelectionChange?(filteredPVs);
    }
    setSelectAll(!selectAll);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') return value.toFixed(3);
    return String(value);
  };

  return (
    <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox checked={selectAll} onChange={handleSelectAll} size="small" />
            </TableCell>
            <TableCell align="center" sx={{ width: 50 }}>
              {PV_HEADER_STRINGS[PVHeader.SEVERITY]}
            </TableCell>
            <TableCell sx={{ width: 120 }}>{PV_HEADER_STRINGS[PVHeader.DEVICE]}</TableCell>
            <TableCell sx={{ minWidth: 200, fontFamily: 'monospace' }}>
              {PV_HEADER_STRINGS[PVHeader.PV]}
            </TableCell>
            <TableCell align="right" sx={{ minWidth: 100 }}>
              {PV_HEADER_STRINGS[PVHeader.SETPOINT]}
            </TableCell>
            <TableCell align="right" sx={{ minWidth: 100 }}>
              {PV_HEADER_STRINGS[PVHeader.LIVE_SETPOINT]}
            </TableCell>
            <TableCell align="right" sx={{ minWidth: 100 }}>
              {PV_HEADER_STRINGS[PVHeader.READBACK]}
            </TableCell>
            <TableCell align="right" sx={{ minWidth: 100 }}>
              {PV_HEADER_STRINGS[PVHeader.LIVE_READBACK]}
            </TableCell>
            <TableCell align="center" sx={{ width: 60 }}>
              {PV_HEADER_STRINGS[PVHeader.CONFIG]}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPVs.map((pv) => (
            <TableRow key={pv.uuid} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedPVs.has(pv.uuid)}
                  onChange={() => handleCheckboxChange(pv.uuid)}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">{getSeverityIcon(pv.setpoint_data.severity)}</TableCell>
              <TableCell>{pv.device}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{pv.setpoint}</TableCell>
              <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                {formatValue(pv.setpoint_data.data)}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: 'monospace', fontStyle: 'italic', color: 'text.secondary' }}>
                --
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                {formatValue(pv.readback_data.data)}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: 'monospace', fontStyle: 'italic', color: 'text.secondary' }}>
                --
              </TableCell>
              <TableCell align="center">{pv.config || '--'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredPVs.length === 0 && (
        <Box sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {searchFilter ? 'No PVs match your search' : 'No PVs available'}
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
};
