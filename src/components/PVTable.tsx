import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { VirtualTable, createPVColumns, PVRow } from './VirtualTable';
import { useLiveValues } from '../hooks';
import { checkTolerance } from '../utils/tolerance';
import { PV } from '../types';

interface PVTableProps {
  pvs: PV[];
  searchFilter?: string;
  onSelectionChange?: (selectedPVs: PV[]) => void;
  showLiveValues?: boolean;
  isLoading?: boolean;
}

/**
 * PV Table component with virtualization and live value support
 */
export const PVTable: React.FC<PVTableProps> = ({
  pvs,
  searchFilter = '',
  onSelectionChange,
  showLiveValues = true,
  isLoading = false,
}) => {
  // Filter PVs based on search (client-side filtering for now)
  const filteredPVs = useMemo(() => {
    if (!searchFilter) return pvs;

    const lowerFilter = searchFilter.toLowerCase();
    return pvs.filter(
      (pv) =>
        pv.setpoint.toLowerCase().includes(lowerFilter) ||
        pv.device.toLowerCase().includes(lowerFilter) ||
        pv.description.toLowerCase().includes(lowerFilter)
    );
  }, [pvs, searchFilter]);

  // Get PV names for live value subscription
  const pvNames = useMemo(() => {
    if (!showLiveValues) return [];
    const names: string[] = [];
    filteredPVs.forEach((pv) => {
      if (pv.setpoint) names.push(pv.setpoint);
      if (pv.readback) names.push(pv.readback);
    });
    return names;
  }, [filteredPVs, showLiveValues]);

  // Subscribe to live values - updates every 1 second if there are changes
  const { liveValues } = useLiveValues({
    pvNames,
    throttleMs: 1000,
    enabled: showLiveValues,
  });

  // Transform PVs to table row format
  const tableData: PVRow[] = useMemo(() => {
    return filteredPVs.map((pv) => {
      const liveSetpoint = liveValues.get(pv.setpoint) || null;
      const liveReadback = liveValues.get(pv.readback) || null;

      const withinTolerance = checkTolerance(
        pv.setpoint_data?.data as number | string | null | undefined,
        liveSetpoint?.data as number | string | null | undefined,
        pv.abs_tolerance ?? 0,
        pv.rel_tolerance ?? 0
      );

      return {
        id: pv.uuid,
        device: pv.device,
        pvName: pv.setpoint,
        savedSetpoint: pv.setpoint_data || null,
        liveSetpoint: showLiveValues ? liveSetpoint : null,
        savedReadback: pv.readback_data || null,
        liveReadback: showLiveValues ? liveReadback : null,
        severity: pv.setpoint_data?.severity,
        withinTolerance,
        config: pv.config,
      };
    });
  }, [filteredPVs, liveValues, showLiveValues]);

  // Column configuration
  const columns = useMemo(
    () =>
      createPVColumns({
        enableSelection: !!onSelectionChange,
        showLiveValues,
        showConfig: true,
      }),
    [onSelectionChange, showLiveValues]
  );

  const handleRowClick = (row: PVRow) => {
    // Could be used for opening PV details
    console.log('Row clicked:', row);
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <VirtualTable
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        getRowId={(row) => row.id}
        emptyMessage={searchFilter ? 'No PVs match your search' : 'No PVs available'}
        estimateSize={41}
        overscan={10}
      />
    </Box>
  );
};

export default PVTable;
