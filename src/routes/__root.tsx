import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Layout } from '../components';
import { SnapshotProvider } from '../contexts';

// Create Material UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0066cc',
    },
    secondary: {
      main: '#666666',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(224, 224, 224, 1)',
        },
        head: {
          backgroundColor: '#fafafa',
          fontWeight: 600,
        },
      },
    },
  },
});

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnapshotProvider>
        <Layout>
          <Outlet />
        </Layout>
      </SnapshotProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  ),
});
