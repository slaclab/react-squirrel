import React, { useState, useMemo } from 'react';
import { PV, PVHeader, PV_HEADER_STRINGS, Severity } from '../types';

interface PVTableProps {
  pvs: PV[];
  searchFilter: string;
  onSelectionChange?: (selectedPVs: PV[]) => void;
}

const getSeverityIcon = (severity?: Severity): string => {
  switch (severity) {
    case Severity.NO_ALARM:
      return '✓';
    case Severity.MINOR:
      return '⚠';
    case Severity.MAJOR:
      return '⚠';
    case Severity.INVALID:
      return '✗';
    default:
      return '--';
  }
};

const getSeverityClass = (severity?: Severity): string => {
  switch (severity) {
    case Severity.NO_ALARM:
      return 'severity-no-alarm';
    case Severity.MINOR:
      return 'severity-minor';
    case Severity.MAJOR:
      return 'severity-major';
    case Severity.INVALID:
      return 'severity-invalid';
    default:
      return '';
  }
};

export const PVTable: React.FC<PVTableProps> = ({ pvs, searchFilter, onSelectionChange }) => {
  const [selectedPVs, setSelectedPVs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Filter PVs based on search
  const filteredPVs = useMemo(() => {
    if (!searchFilter) return pvs;

    const lowerFilter = searchFilter.toLowerCase();
    return pvs.filter(pv =>
      pv.setpoint.toLowerCase().includes(lowerFilter) ||
      pv.device.toLowerCase().includes(lowerFilter) ||
      pv.description.toLowerCase().includes(lowerFilter)
    );
  }, [pvs, searchFilter]);

  const handleCheckboxChange = (pvUuid: string) => {
    const newSelected = new Set(selectedPVs);
    if (newSelected.has(pvUuid)) {
      newSelected.delete(pvUuid);
    } else {
      newSelected.add(pvUuid);
    }
    setSelectedPVs(newSelected);

    if (onSelectionChange) {
      const selected = pvs.filter(pv => newSelected.has(pv.uuid));
      onSelectionChange(selected);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPVs(new Set());
      onSelectionChange?.([]);
    } else {
      const allUuids = new Set(filteredPVs.map(pv => pv.uuid));
      setSelectedPVs(allUuids);
      onSelectionChange?(filteredPVs);
    }
    setSelectAll(!selectAll);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') return value.toFixed(3);
    return String(value);
  };

  return (
    <div className="pv-table-container">
      <table className="pv-table">
        <thead>
          <tr>
            <th className="checkbox-column">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
            <th className="severity-column">{PV_HEADER_STRINGS[PVHeader.SEVERITY]}</th>
            <th className="device-column">{PV_HEADER_STRINGS[PVHeader.DEVICE]}</th>
            <th className="pv-column">{PV_HEADER_STRINGS[PVHeader.PV]}</th>
            <th className="value-column">{PV_HEADER_STRINGS[PVHeader.SETPOINT]}</th>
            <th className="value-column">{PV_HEADER_STRINGS[PVHeader.LIVE_SETPOINT]}</th>
            <th className="value-column">{PV_HEADER_STRINGS[PVHeader.READBACK]}</th>
            <th className="value-column">{PV_HEADER_STRINGS[PVHeader.LIVE_READBACK]}</th>
            <th className="config-column">{PV_HEADER_STRINGS[PVHeader.CONFIG]}</th>
          </tr>
        </thead>
        <tbody>
          {filteredPVs.map(pv => (
            <tr key={pv.uuid}>
              <td className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedPVs.has(pv.uuid)}
                  onChange={() => handleCheckboxChange(pv.uuid)}
                />
              </td>
              <td className={`severity-column ${getSeverityClass(pv.setpoint_data.severity)}`}>
                {getSeverityIcon(pv.setpoint_data.severity)}
              </td>
              <td className="device-column">{pv.device}</td>
              <td className="pv-column">{pv.setpoint}</td>
              <td className="value-column">{formatValue(pv.setpoint_data.data)}</td>
              <td className="value-column live-value">--</td>
              <td className="value-column">{formatValue(pv.readback_data.data)}</td>
              <td className="value-column live-value">--</td>
              <td className="config-column">{pv.config || '--'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredPVs.length === 0 && (
        <div className="no-results">
          {searchFilter ? 'No PVs match your search' : 'No PVs available'}
        </div>
      )}
    </div>
  );
};
