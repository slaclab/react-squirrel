import React, { useState } from 'react';
import { FaRedo, FaPlus } from 'react-icons/fa';
import { Snapshot, PV } from '../types';
import { SnapshotHeader, SearchBar, PVTable } from '../components';

interface SnapshotDetailsPageProps {
  snapshot: Snapshot | null;
  onBack: () => void;
  onRestore?: (pvs: PV[]) => void;
  onCompare?: (snapshot: Snapshot, comparisonSnapshot: Snapshot) => void;
}

export const SnapshotDetailsPage: React.FC<SnapshotDetailsPageProps> = ({
  snapshot,
  onBack,
  onRestore,
  onCompare,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedPVs, setSelectedPVs] = useState<PV[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  const handleRestore = () => {
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (onRestore) {
      // If no PVs selected, restore all
      const pvsToRestore = selectedPVs.length > 0 ? selectedPVs : snapshot?.pvs || [];
      onRestore(pvsToRestore);
    }
    setShowRestoreDialog(false);
  };

  const handleCompare = () => {
    setShowCompareDialog(true);
  };

  if (!snapshot) {
    return (
      <div className="snapshot-details-page">
        <div className="loading">Loading snapshot...</div>
      </div>
    );
  }

  return (
    <div className="snapshot-details-page">
      <SnapshotHeader snapshot={snapshot} onBack={onBack} />

      <div className="interactions-bar">
        <SearchBar
          value={searchText}
          onChange={setSearchText}
          placeholder="Search PVs..."
        />
        <div className="action-buttons">
          <button className="restore-button" onClick={handleRestore}>
            <FaRedo /> Restore
          </button>
          <button className="compare-button" onClick={handleCompare}>
            <FaPlus /> Compare
          </button>
        </div>
      </div>

      <PVTable
        pvs={snapshot.pvs}
        searchFilter={searchText}
        onSelectionChange={setSelectedPVs}
      />

      {/* Restore Confirmation Dialog */}
      {showRestoreDialog && (
        <div className="dialog-overlay" onClick={() => setShowRestoreDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>
              {selectedPVs.length === 0
                ? 'Restore all PVs?'
                : `Restore ${selectedPVs.length} selected PV${selectedPVs.length > 1 ? 's' : ''}?`}
            </h2>
            <div className="dialog-buttons">
              <button className="dialog-cancel" onClick={() => setShowRestoreDialog(false)}>
                Cancel
              </button>
              <button className="dialog-ok" onClick={confirmRestore}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Dialog - Placeholder */}
      {showCompareDialog && (
        <div className="dialog-overlay" onClick={() => setShowCompareDialog(false)}>
          <div className="dialog compare-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Select Comparison Snapshot</h2>
            <p>Comparison functionality will be implemented here.</p>
            <div className="dialog-buttons">
              <button className="dialog-cancel" onClick={() => setShowCompareDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
