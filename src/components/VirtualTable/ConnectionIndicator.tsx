/**
 * Connection Indicator
 *
 * Shows per-PV connection status with a colored dot.
 * - Green: Connected and fresh
 * - Yellow: Connected but stale (>60s old)
 * - Red: Disconnected
 * - Gray: Unknown
 */

import { Tooltip, Box } from '@mui/material';
import {
  Circle as ConnectedIcon,
  RadioButtonUnchecked as DisconnectedIcon,
  HelpOutline as UnknownIcon,
} from '@mui/icons-material';

interface ConnectionIndicatorProps {
  /** Whether the PV is connected (undefined = unknown) */
  connected: boolean | undefined;
  /** When the value was last updated (Unix timestamp) */
  updatedAt: number | undefined;
  /** Icon size */
  size?: 'small' | 'medium';
  /** Threshold in seconds for considering data stale (default: 60) */
  staleThresholdSeconds?: number;
}

export function ConnectionIndicator({
  connected,
  updatedAt,
  size = 'small',
  staleThresholdSeconds = 60,
}: ConnectionIndicatorProps) {
  const iconSize = size === 'small' ? 12 : 16;

  // Calculate staleness
  const now = Date.now() / 1000;
  const age = updatedAt ? now - updatedAt : null;
  const isStale = age !== null && age > staleThresholdSeconds;

  // Unknown state
  if (connected === undefined) {
    return (
      <Tooltip title="Connection status unknown">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <UnknownIcon sx={{ fontSize: iconSize, color: 'grey.500' }} />
        </Box>
      </Tooltip>
    );
  }

  // Disconnected
  if (!connected) {
    return (
      <Tooltip title="Disconnected from IOC">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DisconnectedIcon sx={{ fontSize: iconSize, color: 'error.main' }} />
        </Box>
      </Tooltip>
    );
  }

  // Connected but stale
  if (isStale) {
    const ageDisplay = age! < 3600 ? `${Math.round(age! / 60)}m` : `${Math.round(age! / 3600)}h`;

    return (
      <Tooltip title={`Connected but stale (${ageDisplay} old)`}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ConnectedIcon sx={{ fontSize: iconSize, color: 'warning.main' }} />
        </Box>
      </Tooltip>
    );
  }

  // Connected and fresh
  return (
    <Tooltip title="Connected">
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ConnectedIcon sx={{ fontSize: iconSize, color: 'success.main' }} />
      </Box>
    </Tooltip>
  );
}
