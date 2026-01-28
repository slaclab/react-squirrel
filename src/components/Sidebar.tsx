import { ReactElement } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Camera as ApertureIcon,
  PhotoCamera as CameraIcon,
  Search as SearchIcon,
  Label as LabelIcon,
  ChevronLeft as ChevronLeftIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useSnapshot } from '../contexts';

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 60;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  onSaveSnapshot?: () => void;
}

function getStatusBackgroundColor(hasError: boolean, hasSnapshotId: boolean): string {
  if (hasError) {
    return 'rgba(244, 67, 54, 0.2)';
  }
  if (hasSnapshotId) {
    return 'rgba(76, 175, 80, 0.2)';
  }
  return 'rgba(33, 150, 243, 0.2)';
}

function getHoverBackgroundColor(hasError: boolean): Record<string, string> {
  if (hasError) {
    return { backgroundColor: 'rgba(244, 67, 54, 0.3)' };
  }
  return { backgroundColor: 'rgba(76, 175, 80, 0.3)' };
}

function getStatusMessage(isCreating: boolean, message: string | null, hasError: boolean): string {
  if (isCreating) {
    return message || 'Creating snapshot...';
  }
  if (hasError) {
    return 'Failed - Click to dismiss';
  }
  return 'Snapshot ready - Click to view';
}

export function Sidebar({ open, onToggle, onSaveSnapshot }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { snapshotProgress, clearSnapshot } = useSnapshot();

  const menuItems = [
    { title: 'View Snapshots', icon: <ApertureIcon />, path: '/snapshots' },
    { title: 'Browse PVs', icon: <SearchIcon />, path: '/pv-browser' },
    { title: 'Configure Tags', icon: <LabelIcon />, path: '/tags' },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleSnapshotClick = () => {
    if (snapshotProgress.snapshotId) {
      // Navigate to the completed snapshot
      navigate({ to: '/snapshot-details', search: { id: snapshotProgress.snapshotId } });
      clearSnapshot();
    } else if (snapshotProgress.error) {
      // Clear error state
      clearSnapshot();
    }
  };

  // Determine if we should show the status indicator
  const showStatus =
    snapshotProgress.isCreating || snapshotProgress.snapshotId || snapshotProgress.error;

  const renderStatusIcon = (): ReactElement => {
    if (snapshotProgress.isCreating) {
      if (snapshotProgress.progress !== null) {
        return (
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={snapshotProgress.progress}
              size={16}
              sx={{ color: '#2196f3' }}
            />
          </Box>
        );
      }
      return <CircularProgress size={16} sx={{ color: '#2196f3' }} />;
    }
    if (snapshotProgress.error) {
      return <ErrorIcon sx={{ color: '#f44336', fontSize: 16 }} />;
    }
    return <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
          boxSizing: 'border-box',
          backgroundColor: '#2c3e50',
          color: 'white',
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Header with Squirrel branding */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          p: 2,
          minHeight: 64,
        }}
      >
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
              Squirrel
            </Typography>
          </Box>
        )}
        <IconButton onClick={onToggle} sx={{ color: 'white' }}>
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

      {/* Navigation Menu */}
      <List sx={{ px: 1, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              sx={{
                borderRadius: 1,
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2,
                backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.title} sx={{ color: 'white' }} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Snapshot Status and Save Button at Bottom */}
      <Box sx={{ p: 1, mt: 'auto' }}>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', mb: 1 }} />

        {/* Snapshot Status Indicator */}
        {showStatus && (
          <Box
            onClick={handleSnapshotClick}
            sx={{
              mb: 1,
              p: 1,
              borderRadius: 1,
              backgroundColor: getStatusBackgroundColor(
                !!snapshotProgress.error,
                !!snapshotProgress.snapshotId
              ),
              cursor: snapshotProgress.isCreating ? 'default' : 'pointer',
              '&:hover': snapshotProgress.isCreating
                ? {}
                : getHoverBackgroundColor(!!snapshotProgress.error),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {renderStatusIcon()}
              {open && (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getStatusMessage(
                      snapshotProgress.isCreating,
                      snapshotProgress.message,
                      !!snapshotProgress.error
                    )}
                  </Typography>
                  {snapshotProgress.isCreating && snapshotProgress.progress !== null && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'block',
                        fontSize: '0.65rem',
                      }}
                    >
                      {snapshotProgress.progress}% complete
                    </Typography>
                  )}
                  {snapshotProgress.title && !snapshotProgress.isCreating && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.65rem',
                      }}
                    >
                      {snapshotProgress.title}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Save Snapshot Button */}
        <ListItemButton
          onClick={onSaveSnapshot}
          disabled={snapshotProgress.isCreating}
          sx={{
            borderRadius: 1,
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2,
            backgroundColor: snapshotProgress.isCreating
              ? 'rgba(128, 128, 128, 0.2)'
              : 'rgba(76, 175, 80, 0.2)',
            '&:hover': {
              backgroundColor: snapshotProgress.isCreating
                ? 'rgba(128, 128, 128, 0.2)'
                : 'rgba(76, 175, 80, 0.3)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 2 : 'auto',
              justifyContent: 'center',
              color: snapshotProgress.isCreating ? '#888' : '#4caf50',
            }}
          >
            <CameraIcon />
          </ListItemIcon>
          {open && (
            <ListItemText
              primary="Save Snapshot"
              sx={{ color: snapshotProgress.isCreating ? 'rgba(255,255,255,0.5)' : 'white' }}
            />
          )}
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
