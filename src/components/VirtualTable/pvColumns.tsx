import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@mui/material';
import { EpicsData, Severity } from '../../types';
import { SeverityIcon, EpicsValueCell, LiveValueCell, PVNameCell, DeviceCell } from './ValueCells';

/**
 * Row data structure for PV tables
 */
export interface PVRow {
  id: string;
  device: string;
  pvName: string;
  savedSetpoint: EpicsData | null;
  liveSetpoint: EpicsData | null;
  savedReadback: EpicsData | null;
  liveReadback: EpicsData | null;
  severity: Severity | undefined;
  withinTolerance: boolean;
  config?: string;
}

const columnHelper = createColumnHelper<PVRow>();

/**
 * Create PV columns with optional selection support
 */
export function createPVColumns(options?: {
  enableSelection?: boolean;
  showLiveValues?: boolean;
  showConfig?: boolean;
}): ColumnDef<PVRow, unknown>[] {
  const { enableSelection = true, showLiveValues = true, showConfig = true } = options || {};

  const columns: ColumnDef<PVRow, unknown>[] = [];

  // Selection column
  if (enableSelection) {
    columns.push(
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            size="small"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            size="small"
          />
        ),
        size: 50,
      }) as ColumnDef<PVRow, unknown>
    );
  }

  // Severity column
  columns.push(
    columnHelper.accessor('severity', {
      header: '',
      cell: ({ getValue }) => <SeverityIcon severity={getValue()} />,
      size: 50,
      enableSorting: false,
    }) as ColumnDef<PVRow, unknown>
  );

  // Device column
  columns.push(
    columnHelper.accessor('device', {
      header: 'Device',
      cell: ({ getValue }) => <DeviceCell device={getValue()} />,
      enableSorting: true,
      size: 120,
    }) as ColumnDef<PVRow, unknown>
  );

  // PV Name column
  columns.push(
    columnHelper.accessor('pvName', {
      header: 'PV Name',
      cell: ({ getValue }) => <PVNameCell name={getValue()} />,
      enableSorting: true,
      size: 250,
    }) as ColumnDef<PVRow, unknown>
  );

  // Saved Setpoint column
  columns.push(
    columnHelper.accessor('savedSetpoint', {
      header: 'Saved Setpoint',
      cell: ({ getValue }) => <EpicsValueCell value={getValue()} />,
      size: 100,
      enableSorting: false,
    }) as ColumnDef<PVRow, unknown>
  );

  // Live Setpoint column
  if (showLiveValues) {
    columns.push(
      columnHelper.accessor('liveSetpoint', {
        header: 'Live Setpoint',
        cell: ({ getValue, row }) => (
          <LiveValueCell
            value={getValue()}
            savedValue={row.original.savedSetpoint}
            withinTolerance={row.original.withinTolerance}
          />
        ),
        size: 100,
        enableSorting: false,
      }) as ColumnDef<PVRow, unknown>
    );
  }

  // Saved Readback column
  columns.push(
    columnHelper.accessor('savedReadback', {
      header: 'Saved Readback',
      cell: ({ getValue }) => <EpicsValueCell value={getValue()} />,
      size: 100,
      enableSorting: false,
    }) as ColumnDef<PVRow, unknown>
  );

  // Live Readback column
  if (showLiveValues) {
    columns.push(
      columnHelper.accessor('liveReadback', {
        header: 'Live Readback',
        cell: ({ getValue }) => <LiveValueCell value={getValue()} />,
        size: 100,
        enableSorting: false,
      }) as ColumnDef<PVRow, unknown>
    );
  }

  return columns;
}

/**
 * Default PV columns with all features enabled
 */
export const pvColumns = createPVColumns();

export default pvColumns;
