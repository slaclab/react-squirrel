import React, { useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Tooltip } from '@mui/material';
import { Help as HelpIcon, BugReport as BugReportIcon } from '@mui/icons-material';
import { Sidebar } from './Sidebar';
import { UserAvatar } from './UserAvatar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleHelpClick = () => {
    window.open('https://github.com/slaclab/squirrel', '_blank');
  };

  const handleBugReportClick = () => {
    window.open('https://forms.office.com/r/A6p1TmFNw3', '_blank');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          ml: 0,
          transition: 'margin 0.3s',
        }}
      >
        {/* Top App Bar with User Avatar */}
        <AppBar
          position="static"
          elevation={1}
          sx={{
            backgroundColor: 'white',
            color: 'text.primary',
            zIndex: (theme) => theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end', minHeight: '64px !important', gap: 1 }}>
            <Tooltip title="Help">
              <IconButton onClick={handleHelpClick} color="inherit">
                <HelpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Report a Bug">
              <IconButton onClick={handleBugReportClick} color="inherit">
                <BugReportIcon />
              </IconButton>
            </Tooltip>
            <UserAvatar userName="Test User" userInitials="T" isAdmin={true} />
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
