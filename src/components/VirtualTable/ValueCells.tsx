import { Box, Typography } from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Cancel,
} from '@mui/icons-material';
import { EpicsData, Severity } from '../../types';

/**
 * Display severity icon based on EPICS severity level
 */
export function SeverityIcon({ severity }: { severity?: Severity }) {
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
}

/**
 * Format EPICS value for display
 */
function formatValue(value: unknown, precision?: number): string {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'number') {
    return value.toFixed(precision ?? 3);
  }
  if (Array.isArray(value)) {
    return `[${value.length} elements]`;
  }
  return String(value);
}

/**
 * Display EPICS value with formatting
 */
export function EpicsValueCell({ value }: { value: EpicsData | null | undefined }) {
  if (!value?.data && value?.data !== 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
        --
      </Typography>
    );
  }

  const formatted = formatValue(value.data, value.precision);

  return (
    <Typography
      variant="body2"
      sx={{ fontFamily: 'monospace' }}
      title={value.units ? `${formatted} ${value.units}` : formatted}
    >
      {formatted}
    </Typography>
  );
}

/**
 * Display live value with diff highlighting
 */
export function LiveValueCell({
  value,
  savedValue,
  withinTolerance = true,
}: {
  value: EpicsData | null | undefined;
  savedValue?: EpicsData | null;
  withinTolerance?: boolean;
}) {
  const isDifferent = savedValue && value && !withinTolerance;

  return (
    <Box
      sx={{
        color: isDifferent ? 'error.main' : 'text.secondary',
        fontStyle: 'italic',
      }}
    >
      <EpicsValueCell value={value} />
    </Box>
  );
}

/**
 * Display a code-styled PV name
 */
export function PVNameCell({ name }: { name: string }) {
  return (
    <Typography
      variant="body2"
      sx={{
        fontFamily: 'monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={name}
    >
      {name}
    </Typography>
  );
}

/**
 * Display device name
 */
export function DeviceCell({ device }: { device: string }) {
  return (
    <Typography
      variant="body2"
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={device}
    >
      {device}
    </Typography>
  );
}

export default {
  SeverityIcon,
  EpicsValueCell,
  LiveValueCell,
  PVNameCell,
  DeviceCell,
};
