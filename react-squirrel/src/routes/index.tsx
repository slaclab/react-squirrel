import { createFileRoute } from '@tanstack/react-router';
import { Box, Typography, Button, Stack, Grid, Card, CardContent, CardActions } from '@mui/material';
import {
  Storage,
  PhotoCamera,
  CompareArrows,
  BrowseGallery,
  Label,
  Info,
} from '@mui/icons-material';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

const pages = [
  {
    title: 'View Snapshots',
    description: 'Browse and manage all configuration snapshots',
    icon: <PhotoCamera sx={{ fontSize: 40 }} />,
    path: '/snapshots',
    color: 'primary.main',
  },
  {
    title: 'Snapshot Details',
    description: 'View detailed information about a specific snapshot',
    icon: <Info sx={{ fontSize: 40 }} />,
    path: '/snapshot-details',
    color: 'secondary.main',
  },
  {
    title: 'Compare Snapshots',
    description: 'Compare two snapshots side-by-side',
    icon: <CompareArrows sx={{ fontSize: 40 }} />,
    path: '/comparison',
    color: 'success.main',
  },
  {
    title: 'PV Browser',
    description: 'Browse and search all process variables',
    icon: <BrowseGallery sx={{ fontSize: 40 }} />,
    path: '/pv-browser',
    color: 'info.main',
  },
  {
    title: 'Tag Management',
    description: 'Create and manage tag groups',
    icon: <Label sx={{ fontSize: 40 }} />,
    path: '/tags',
    color: 'warning.main',
  },
];

function Index() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 4,
      }}
    >
      <Stack spacing={4} alignItems="center" sx={{ mb: 6, mt: 4 }}>
        <Storage sx={{ fontSize: 80, color: 'primary.main' }} />
        <Typography variant="h3" component="h1" fontWeight="bold">
          React Squirrel
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          Configuration Management for EPICS PVs
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={600}>
          A modern, type-safe React implementation aligned with STRUDEL Workshop 2025 best
          practices for scientific UI applications.
        </Typography>
      </Stack>

      <Grid container spacing={3} maxWidth={1200} sx={{ mx: 'auto' }}>
        {pages.map((page) => (
          <Grid item xs={12} sm={6} md={4} key={page.path}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: page.color, mb: 2 }}>{page.icon}</Box>
                <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
                  {page.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {page.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button component={Link} to={page.path} variant="outlined" size="medium">
                  Open
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
