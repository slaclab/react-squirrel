/**
 * Live Data Warning Banner
 *
 * Displays a prominent warning when the PV monitor is not responding.
 * This catches the case where the monitor process dies silently.
 */

import { Alert, Box, Typography, Collapse } from '@mui/material';
import { SignalWifiOff as DisconnectedIcon } from '@mui/icons-material';
import { useHeartbeat } from '../contexts/HeartbeatContext';

/**
 * Format age in seconds to a human-readable string.
 */
function formatAge(ageSeconds: number | null): string {
  if (ageSeconds === null) {
    return 'unknown';
  }

  if (ageSeconds < 60) {
    return `${Math.round(ageSeconds)}s ago`;
  }

  if (ageSeconds < 3600) {
    return `${Math.round(ageSeconds / 60)}m ago`;
  }

  return `${Math.round(ageSeconds / 3600)}h ago`;
}

export function LiveDataWarningBanner() {
  const { isMonitorAlive, heartbeatAgeSeconds } = useHeartbeat();

  // Don't render anything if monitor is alive
  if (isMonitorAlive) {
    return null;
  }

  const ageDisplay = formatAge(heartbeatAgeSeconds);

  return (
    <Collapse in={!isMonitorAlive}>
      <Alert
        severity="error"
        icon={<DisconnectedIcon />}
        sx={{
          borderRadius: 0,
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body1" fontWeight="bold">
            LIVE DATA DISCONNECTED
          </Typography>
          <Typography variant="body2">Last update: {ageDisplay}</Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          The monitoring system is not responding. Data shown may be stale.
        </Typography>
      </Alert>
    </Collapse>
  );
}
