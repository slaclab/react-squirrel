import { createFileRoute } from '@tanstack/react-router';
import { PVBrowserPage } from '../pages';
import { PV, EpicsData, Severity, Status } from '../types';

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

export const Route = createFileRoute('/pv-browser')({
  component: PVBrowser,
});

function PVBrowser() {
  const handleAddPV = () => {
    console.log('Add PV clicked');
    alert('Add PV functionality would be implemented here');
  };

  const handleImportPVs = () => {
    console.log('Import PVs clicked');
    alert('Import PVs functionality would be implemented here');
  };

  const handleDeletePV = (pv: PV) => {
    console.log('Delete PV:', pv);
    alert(`Delete PV ${pv.setpoint} functionality would be implemented here`);
  };

  const handlePVClick = (pv: PV) => {
    console.log('PV clicked:', pv);
  };

  return (
    <PVBrowserPage
      pvs={samplePVs}
      onAddPV={handleAddPV}
      onImportPVs={handleImportPVs}
      onDeletePV={handleDeletePV}
      onPVClick={handlePVClick}
    />
  );
}
