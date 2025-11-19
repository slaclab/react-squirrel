import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { SnapshotListPage } from '../pages';
import { Snapshot } from '../types';
import { snapshotService } from '../services';

export const Route = createFileRoute('/snapshots')({
  component: Snapshots,
});

function Snapshots() {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await snapshotService.findSnapshots();

        // Convert SnapshotSummaryDTO to Snapshot format
        const formattedSnapshots: Snapshot[] = data.map((snapshot) => ({
          uuid: snapshot.id,
          title: snapshot.title,
          description: snapshot.comment || '',
          pvs: [], // Summary doesn't include PV details
          creation_time: new Date(snapshot.createdDate),
        }));

        setSnapshots(formattedSnapshots);
      } catch (err) {
        console.error('Failed to fetch snapshots:', err);
        setError(err instanceof Error ? err.message : 'Failed to load snapshots');
        setSnapshots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, []);

  const handleSnapshotClick = (snapshot: Snapshot) => {
    navigate({ to: '/snapshot-details', search: { id: snapshot.uuid } });
  };

  if (loading) {
    return <div>Loading snapshots...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <SnapshotListPage snapshots={snapshots} onSnapshotClick={handleSnapshotClick} />;
}
