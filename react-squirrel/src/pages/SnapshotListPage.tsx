import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { Snapshot } from '../types';

interface SnapshotListPageProps {
  snapshots: Snapshot[];
  onSnapshotClick: (snapshot: Snapshot) => void;
}

export const SnapshotListPage: React.FC<SnapshotListPageProps> = ({
  snapshots,
  onSnapshotClick,
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredSnapshots = useMemo(() => {
    if (!searchText) return snapshots;

    const lowerFilter = searchText.toLowerCase();
    return snapshots.filter(
      (snapshot) =>
        snapshot.title.toLowerCase().includes(lowerFilter) ||
        snapshot.description.toLowerCase().includes(lowerFilter)
    );
  }, [snapshots, searchText]);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', p: 2 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search title..."
          size="small"
          sx={{ maxWidth: 400, flex: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Title
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Description
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Created
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  PV Count
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSnapshots.map((snapshot) => (
              <TableRow
                key={snapshot.uuid}
                hover
                sx={{ cursor: 'pointer' }}
                onDoubleClick={() => onSnapshotClick(snapshot)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {snapshot.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {snapshot.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatTimestamp(snapshot.creation_time)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{snapshot.pvs.length}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredSnapshots.length === 0 && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchText ? 'No snapshots match your search' : 'No snapshots available'}
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
};
