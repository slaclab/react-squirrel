import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { Snapshot } from '../types';

interface SnapshotHeaderProps {
  snapshot: Snapshot | null;
  onBack: () => void;
}

export const SnapshotHeader: React.FC<SnapshotHeaderProps> = ({ snapshot, onBack }) => {
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="snapshot-header">
      <button className="back-button" onClick={onBack} aria-label="Go back">
        <FaArrowLeft size={24} />
      </button>
      <span className="header-label">Snapshot</span>
      <span className="header-separator">|</span>
      <span className="snapshot-title">{snapshot?.title || 'Loading...'}</span>
      <span className="header-separator">|</span>
      <span className="snapshot-time">
        {snapshot?.creation_time ? formatTimestamp(snapshot.creation_time) : ''}
      </span>
    </div>
  );
};
