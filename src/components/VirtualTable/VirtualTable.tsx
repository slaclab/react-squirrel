import { useRef, useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableSortLabel, Paper, Box, Typography, CircularProgress } from '@mui/material';

interface VirtualTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  estimateSize?: number;
  overscan?: number;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  rowClassName?: (row: T) => string;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  manualSorting?: boolean;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: T[]) => void;
  getRowId?: (row: T) => string;
  emptyMessage?: string;
}

export function VirtualTable<T>({
  data,
  columns,
  estimateSize = 41,
  overscan = 10,
  onRowClick,
  isLoading = false,
  rowClassName,
  sorting,
  onSortingChange,
  manualSorting = true,
  enableRowSelection = false,
  onRowSelectionChange,
  getRowId,
  emptyMessage = 'No data available',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting,
    enableRowSelection,
    state: {
      sorting: sorting || [],
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: onSortingChange
      ? (updater) => {
          const newSorting = typeof updater === 'function' ? updater(sorting || []) : updater;
          onSortingChange(newSorting);
        }
      : undefined,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  // Notify parent of selection changes
  useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, table]);

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  // Calculate total table width from column sizes
  const totalWidth = table.getAllColumns().reduce((sum, col) => sum + col.getSize(), 0);

  return (
    <Paper
      ref={parentRef}
      sx={{
        flex: 1,
        height: '100%',
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
          minWidth: totalWidth,
        }}
      >
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => (
              <Box
                key={header.id}
                sx={{
                  width: header.getSize(),
                  minWidth: header.getSize(),
                  maxWidth: header.getSize(),
                  fontWeight: 'bold',
                  py: 1,
                  px: 1,
                  fontSize: '0.875rem',
                }}
              >
                {header.column.getCanSort() ? (
                  <TableSortLabel
                    active={!!header.column.getIsSorted()}
                    direction={header.column.getIsSorted() || undefined}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableSortLabel>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Virtualized body */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          minWidth: totalWidth,
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <Box
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={rowClassName?.(row.original)}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                minWidth: totalWidth,
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                alignItems: 'center',
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <Box
                  key={cell.id}
                  sx={{
                    width: cell.column.getSize(),
                    minWidth: cell.column.getSize(),
                    maxWidth: cell.column.getSize(),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    py: 1,
                    px: 1,
                    fontSize: '0.875rem',
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Box>
              ))}
            </Box>
          );
        })}
      </div>
    </Paper>
  );
}

export default VirtualTable;
