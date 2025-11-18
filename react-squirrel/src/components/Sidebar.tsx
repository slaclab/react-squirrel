import React from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Camera as CameraIcon,
  Search as SearchIcon,
  Label as LabelIcon,
  ChevronLeft as ChevronLeftIcon,
  Pets as PetsIcon,
} from '@mui/icons-material';
import { Link, useLocation } from '@tanstack/react-router';

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 60;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    { title: 'Snapshots', icon: <CameraIcon />, path: '/snapshots' },
    { title: 'PVs', icon: <SearchIcon />, path: '/pv-browser' },
    { title: 'Tag Groups', icon: <LabelIcon />, path: '/tags' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
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
            <PetsIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
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
      <List sx={{ px: 1 }}>
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
    </Drawer>
  );
};
