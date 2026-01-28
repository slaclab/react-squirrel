import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Stack,
  Button,
  IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import { PV } from '../types';

interface PVDetailsPageProps {
  pv: PV | null;
  onBack?: () => void;
  onEdit?: (pv: PV) => void;
  isAdmin?: boolean;
}

export function PVDetailsPage({ pv, onBack, onEdit, isAdmin = false }: PVDetailsPageProps) {
  if (!pv) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No PV selected
        </Typography>
      </Box>
    );
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') return value.toFixed(3);
    return String(value);
  };

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

  const getTags = (pvData: PV): string[] => {
    const tags: string[] = [];
    Object.values(pvData.tags).forEach((tagSet: unknown) => {
      if (typeof tagSet === 'object' && tagSet !== null) {
        tags.push(...Object.values(tagSet).filter((t): t is string => typeof t === 'string'));
      }
    });
    return tags;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        {onBack && (
          <IconButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          PV Details
        </Typography>
        {isAdmin && onEdit && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => onEdit(pv)}>
            Edit PV
          </Button>
        )}
      </Stack>

      {/* Details */}
      <Paper sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Device
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {pv.device}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1">{pv.description}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Setpoint PV
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
              {pv.setpoint}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Readback PV
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
              {pv.readback}
            </Typography>
          </Grid>

          {/* Current Values */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Current Values
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">
              Setpoint Value
            </Typography>
            <Typography variant="h5" fontWeight={500}>
              {formatValue(pv.setpoint_data?.data)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Status: {pv.setpoint_data?.status || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">
              Readback Value
            </Typography>
            <Typography variant="h5" fontWeight={500}>
              {formatValue(pv.readback_data?.data)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Status: {pv.readback_data?.status || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">
              Config
            </Typography>
            <Typography variant="h5" fontWeight={500}>
              {pv.config || 'N/A'}
            </Typography>
          </Grid>

          {/* Tags */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Tags
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            {getTags(pv).length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {getTags(pv).map((tag) => (
                  <Chip key={tag} label={tag} color="primary" variant="outlined" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tags assigned
              </Typography>
            )}
          </Grid>

          {/* Metadata */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Metadata
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              UUID
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {pv.uuid}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Creation Time
            </Typography>
            <Typography variant="body2">{formatTimestamp(pv.creation_time)}</Typography>
          </Grid>

          {pv.setpoint_data?.timestamp && (
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Last Setpoint Update
              </Typography>
              <Typography variant="body2">{formatTimestamp(pv.setpoint_data.timestamp)}</Typography>
            </Grid>
          )}

          {pv.readback_data?.timestamp && (
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Last Readback Update
              </Typography>
              <Typography variant="body2">{formatTimestamp(pv.readback_data.timestamp)}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}
