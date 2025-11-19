import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SnapshotComparisonPage } from '../pages';
import { Snapshot, PV, EpicsData, Severity, Status } from '../types';

// Sample data for demonstration
const createSampleEpicsData = (
  value: string | number,
  severity: Severity = Severity.NO_ALARM
): EpicsData => ({
  data: value,
  status: Status.NO_ALARM,
  severity: severity,
  timestamp: new Date(),
});

const mainSnapshotPVs: PV[] = [
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
];

const comparisonSnapshotPVs: PV[] = [
  {
    uuid: '1',
    description: 'Main Power Supply Voltage',
    setpoint: 'LINAC:PS:VOLT',
    readback: 'LINAC:PS:VOLT:RBV',
    config: 'AUTO',
    setpoint_data: createSampleEpicsData(24.8, Severity.NO_ALARM), // Different value
    readback_data: createSampleEpicsData(24.82, Severity.NO_ALARM),
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
    setpoint_data: createSampleEpicsData(150.3, Severity.MINOR), // Same value
    readback_data: createSampleEpicsData(150.1, Severity.NO_ALARM),
    config_data: createSampleEpicsData('MANUAL'),
    device: 'LINAC-BCM-01',
    tags: {},
    creation_time: new Date(),
  },
];

const mainSnapshot: Snapshot = {
  uuid: 'snapshot-1',
  title: 'Daily Configuration Backup',
  description: 'Automated daily snapshot of LINAC configuration',
  pvs: mainSnapshotPVs,
  creation_time: new Date(),
};

const comparisonSnapshot: Snapshot = {
  uuid: 'snapshot-2',
  title: 'Pre-Maintenance Snapshot',
  description: 'Snapshot before scheduled maintenance',
  pvs: comparisonSnapshotPVs,
  creation_time: new Date(Date.now() - 86400000), // 1 day ago
};

export const Route = createFileRoute('/comparison')({
  component: Comparison,
});

function Comparison() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate({ to: '/snapshot-details' });
  };

  return (
    <SnapshotComparisonPage
      mainSnapshot={mainSnapshot}
      comparisonSnapshot={comparisonSnapshot}
      onBack={handleBack}
    />
  );
}
