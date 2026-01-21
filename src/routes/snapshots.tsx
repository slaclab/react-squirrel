import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SnapshotListPage } from '../pages';
import { Snapshot } from '../types';
import { useSnapshots, useDeleteSnapshot } from '../hooks';
import { useAdminMode } from '../contexts/AdminModeContext';

export const Route = createFileRoute('/snapshots')({
  component: Snapshots,
});

function Snapshots() {
  const navigate = useNavigate();
  const { isAdminMode } = useAdminMode();
  const { data: snapshots, isLoading, error } = useSnapshots();
  const deleteSnapshotMutation = useDeleteSnapshot();

  // Convert SnapshotSummaryDTO to Snapshot format for the UI
  const formattedSnapshots: Snapshot[] = (snapshots || []).map((snapshot) => ({
    uuid: snapshot.id,
    title: snapshot.title,
    description: snapshot.comment || '',
    pvs: [], // Summary doesn't include PV details
    pvCount: snapshot.pvCount || 0,
    creation_time: new Date(snapshot.createdDate),
  }));

  const handleSnapshotClick = (snapshot: Snapshot) => {
    navigate({ to: '/snapshot-details', search: { id: snapshot.uuid } });
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    await deleteSnapshotMutation.mutateAsync({ snapshotId });
  };

  if (isLoading) {
    return <div>Loading snapshots...</div>;
  }

  if (error) {
    return <div>Error: {error instanceof Error ? error.message : 'Failed to load snapshots'}</div>;
  }

  return (
    <SnapshotListPage
      snapshots={formattedSnapshots}
      onSnapshotClick={handleSnapshotClick}
      onDeleteSnapshot={isAdminMode ? handleDeleteSnapshot : undefined}
    />
  );
}
