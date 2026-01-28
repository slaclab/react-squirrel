import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnapshotDetailsPage } from './pages';
import { Snapshot, PV, EpicsData, Severity, Status, AnyEpicsType } from './types';

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

// Sample data for demonstration
const createSampleEpicsData = (
  value: AnyEpicsType,
  severity: Severity = Severity.NO_ALARM
): EpicsData => ({
  data: value,
  status: Status.NO_ALARM,
  severity,
  timestamp: new Date(),
});

const samplePVs: PV[] = [
  {
    uuid: '1',
    description: 'Main Power Supply Voltage',
    setpoint: 'LINAC:PS:VOLT',
    readback: 'LINAC:PS:VOLT:RBV',
    config: 'AUTO',
    setpoint_data: createSampleEpicsData(24.5, Severity.NO_ALARM),
    readback_data: createSampleEpicsData(24.52, Severity.NO_ALARM),
    config_data: createSampleEpicsData('AUTO'),
    device: 'LINAC-PS-01',
    tags: {},
    creation_time: new Date(),
  },
  {
    uuid: '2',
    description: 'Beam Current Monitor',
    setpoint: 'LINAC:BCM:CURR',
    readback: 'LINAC:BCM:CURR:RBV',
    config: 'MANUAL',
    setpoint_data: createSampleEpicsData(150.3, Severity.MINOR),
    readback_data: createSampleEpicsData(150.1, Severity.NO_ALARM),
    config_data: createSampleEpicsData('MANUAL'),
    device: 'LINAC-BCM-01',
    tags: {},
    creation_time: new Date(),
  },
  {
    uuid: '3',
    description: 'RF Cavity Temperature',
    setpoint: 'LINAC:RF:TEMP',
    readback: 'LINAC:RF:TEMP:RBV',
    config: 'AUTO',
    setpoint_data: createSampleEpicsData(35.7, Severity.NO_ALARM),
    readback_data: createSampleEpicsData(35.8, Severity.NO_ALARM),
    config_data: createSampleEpicsData('AUTO'),
    device: 'LINAC-RF-01',
    tags: {},
    creation_time: new Date(),
  },
  {
    uuid: '4',
    description: 'Vacuum Pump Status',
    setpoint: 'LINAC:VAC:STAT',
    readback: 'LINAC:VAC:STAT:RBV',
    config: 'AUTO',
    setpoint_data: createSampleEpicsData(1, Severity.NO_ALARM),
    readback_data: createSampleEpicsData(1, Severity.NO_ALARM),
    config_data: createSampleEpicsData('AUTO'),
    device: 'LINAC-VAC-01',
    tags: {},
    creation_time: new Date(),
  },
  {
    uuid: '5',
    description: 'Magnet Field Strength',
    setpoint: 'LINAC:MAG:FIELD',
    readback: 'LINAC:MAG:FIELD:RBV',
    config: 'MANUAL',
    setpoint_data: createSampleEpicsData(0.85, Severity.NO_ALARM),
    readback_data: createSampleEpicsData(0.849, Severity.NO_ALARM),
    config_data: createSampleEpicsData('MANUAL'),
    device: 'LINAC-MAG-01',
    tags: {},
    creation_time: new Date(),
  },
];

const sampleSnapshot: Snapshot = {
  uuid: 'snapshot-1',
  title: 'Daily Configuration Backup',
  description: 'Automated daily snapshot of LINAC configuration',
  pvs: samplePVs,
  creation_time: new Date(),
};

function App() {
  const [, setCurrentView] = useState<'list' | 'details'>('details');

  const handleBack = () => {
    // eslint-disable-next-line no-console
    console.log('Navigate back to snapshot list');
    setCurrentView('list');
  };

  const handleRestore = (pvs: PV[]) => {
    // eslint-disable-next-line no-console
    console.log('Restoring PVs:', pvs);
    // eslint-disable-next-line no-alert
    alert(`Restoring ${pvs.length} PV(s)`);
  };

  const handleCompare = (comparisonSnapshotId: string) => {
    // eslint-disable-next-line no-console
    console.log('Comparing with snapshot ID:', comparisonSnapshotId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnapshotDetailsPage
        snapshot={sampleSnapshot}
        onBack={handleBack}
        onRestore={handleRestore}
        onCompare={handleCompare}
      />
    </ThemeProvider>
  );
}

export default App;
