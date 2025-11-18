import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SnapshotListPage } from '../pages';
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
];

const sampleSnapshots: Snapshot[] = [
  {
    uuid: 'snapshot-1',
    title: 'Daily Configuration Backup',
    description: 'Automated daily snapshot of LINAC configuration',
    pvs: samplePVs,
    creation_time: new Date(),
  },
  {
    uuid: 'snapshot-2',
    title: 'Pre-Maintenance Snapshot',
    description: 'Snapshot before scheduled maintenance on 2025-01-15',
    pvs: samplePVs,
    creation_time: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    uuid: 'snapshot-3',
    title: 'Beam Tuning Reference',
    description: 'Optimal beam settings from January 2025',
    pvs: samplePVs,
    creation_time: new Date(Date.now() - 172800000), // 2 days ago
  },
];

export const Route = createFileRoute('/snapshots')({
  component: Snapshots,
});

function Snapshots() {
  const navigate = useNavigate();

  const handleSnapshotClick = (snapshot: Snapshot) => {
    navigate({ to: '/snapshot-details' });
  };

  return <SnapshotListPage snapshots={sampleSnapshots} onSnapshotClick={handleSnapshotClick} />;
}
