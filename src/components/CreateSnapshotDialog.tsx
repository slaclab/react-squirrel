import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import { useSnapshot } from '../contexts';

interface CreateSnapshotDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSnapshotDialog({ open, onClose }: CreateSnapshotDialogProps) {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const { startSnapshot } = useSnapshot();

  const handleCreate = () => {
    if (!title.trim()) {
      return;
    }

    // Fire and forget - starts the snapshot in the background
    startSnapshot(title.trim(), comment.trim() || undefined);

    // Reset form and close dialog immediately
    setTitle('');
    setComment('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Snapshot</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This will capture the current values of all PVs in the system.
          </Typography>

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
            required
            placeholder="e.g., Daily Backup - December 11"
          />

          <TextField
            label="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="Describe the purpose of this snapshot..."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained" disabled={!title.trim()}>
          Start Snapshot
        </Button>
      </DialogActions>
    </Dialog>
  );
}
