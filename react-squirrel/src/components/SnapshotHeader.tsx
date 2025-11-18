import React from 'react';
import { Box, IconButton, Typography, Stack } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Snapshot } from '../types';

interface SnapshotHeaderProps {
  snapshot: Snapshot | null;
  onBack: () => void;
}

export const SnapshotHeader: React.FC<SnapshotHeaderProps> = ({ snapshot, onBack }) => {
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

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.5, mb: 2 }}>
      <IconButton onClick={onBack} aria-label="Go back" size="medium" edge="start">
        <ArrowBack />
      </IconButton>
      <Typography variant="body1" fontWeight={500}>
        Snapshot
      </Typography>
      <Typography variant="h6" color="text.secondary" fontWeight="bold">
        |
      </Typography>
      <Typography variant="body1" fontWeight={600} color="primary">
        {snapshot?.title || 'Loading...'}
      </Typography>
      <Typography variant="h6" color="text.secondary" fontWeight="bold">
        |
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ flex: 1 }}>
        {snapshot?.creation_time ? formatTimestamp(snapshot.creation_time) : ''}
      </Typography>
    </Stack>
  );
};
