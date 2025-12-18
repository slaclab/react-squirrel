/**
 * Row Styles for Virtual Table
 *
 * Provides visual feedback for stale/disconnected PV data:
 * - Disconnected rows are grayed out
 * - Stale rows have a subtle warning background
 */

import { SxProps, Theme } from '@mui/material';

interface RowData {
  live_connected?: boolean;
  live_updated_at?: number;
}

/**
 * Get MUI sx styles for a table row based on its live data status.
 *
 * @param row - Row data containing live_connected and live_updated_at
 * @param staleThresholdSeconds - How old before data is considered stale (default: 300)
 * @returns MUI sx prop object
 *
 * @example
 * <TableRow sx={getRowStyles(row.original)}>
 */
export function getRowStyles(row: RowData, staleThresholdSeconds: number = 300): SxProps<Theme> {
  const now = Date.now() / 1000;
  const age = row.live_updated_at ? now - row.live_updated_at : null;

  // Disconnected - gray out the row
  if (row.live_connected === false) {
    return {
      opacity: 0.5,
      backgroundColor: 'action.disabledBackground',
      '& td': {
        color: 'text.disabled',
      },
    };
  }

  // Stale data (> threshold) - subtle warning
  if (age !== null && age > staleThresholdSeconds) {
    return {
      backgroundColor: 'rgba(237, 108, 2, 0.08)', // warning.light with transparency
      '& td': {
        color: 'warning.dark',
      },
    };
  }

  // Normal - no special styling
  return {};
}

/**
 * Check if a row should be highlighted as having different live vs saved values.
 *
 * @param savedValue - The saved/snapshot value
 * @param liveValue - The current live value
 * @param absTolerance - Absolute tolerance (optional)
 * @param relTolerance - Relative tolerance as decimal (optional)
 * @returns true if values differ beyond tolerance
 */
export function isValueDifferent(
  savedValue: unknown,
  liveValue: unknown,
  absTolerance?: number,
  relTolerance?: number
): boolean {
  // If either is null/undefined, can't compare
  if (savedValue == null || liveValue == null) {
    return false;
  }

  // String comparison
  if (typeof savedValue === 'string' || typeof liveValue === 'string') {
    return String(savedValue) !== String(liveValue);
  }

  // Number comparison with tolerance
  if (typeof savedValue === 'number' && typeof liveValue === 'number') {
    const diff = Math.abs(savedValue - liveValue);

    // Check absolute tolerance
    if (absTolerance !== undefined && diff <= absTolerance) {
      return false;
    }

    // Check relative tolerance
    if (relTolerance !== undefined && savedValue !== 0) {
      const relDiff = diff / Math.abs(savedValue);
      if (relDiff <= relTolerance) {
        return false;
      }
    }

    // No tolerance specified - exact match required
    if (absTolerance === undefined && relTolerance === undefined) {
      return savedValue !== liveValue;
    }

    return true;
  }

  // Array comparison (simplified)
  if (Array.isArray(savedValue) && Array.isArray(liveValue)) {
    if (savedValue.length !== liveValue.length) {
      return true;
    }
    return savedValue.some((v, i) => v !== liveValue[i]);
  }

  // Fallback: strict equality
  return savedValue !== liveValue;
}

/**
 * Get styles for a value cell based on whether it differs from the saved value.
 */
export function getValueCellStyles(isDifferent: boolean): SxProps<Theme> {
  if (!isDifferent) {
    return {};
  }

  return {
    backgroundColor: 'rgba(237, 108, 2, 0.15)', // warning color
    fontWeight: 'bold',
  };
}
