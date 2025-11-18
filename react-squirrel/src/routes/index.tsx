import { createFileRoute } from '@tanstack/react-router';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Storage } from '@mui/icons-material';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Stack spacing={3} alignItems="center">
        <Storage sx={{ fontSize: 80, color: 'primary.main' }} />
        <Typography variant="h3" component="h1" fontWeight="bold">
          React Squirrel
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Configuration Management for EPICS PVs
        </Typography>
        <Button
          component={Link}
          to="/snapshot-details"
          variant="contained"
          size="large"
          sx={{ mt: 2 }}
        >
          View Snapshot Details Demo
        </Button>
      </Stack>
    </Box>
  );
}
