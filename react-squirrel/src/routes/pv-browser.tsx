import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { PVBrowserPage } from '../pages';
import { PV, Severity, Status } from '../types';
import { pvService, tagsService } from '../services';

export const Route = createFileRoute('/pv-browser')({
  component: PVBrowser,
});

// Map to store tag ID -> group name mapping
type TagGroupMap = Map<string, string>; // tagId -> groupName

function PVBrowser() {
  const [pvs, setPVs] = useState<PV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continuationToken, setContinuationToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [tagGroupMap, setTagGroupMap] = useState<TagGroupMap>(new Map());

  const PAGE_SIZE = 100; // Load 100 PVs at a time

  useEffect(() => {
    fetchTagGroupsAndPVs();
  }, []);

  const fetchTagGroupsAndPVs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tag groups first to build the mapping
      const summaries = await tagsService.findAllTagGroups();
      const tagMap = new Map<string, string>();

      await Promise.all(
        summaries.map(async (summary) => {
          try {
            const details = await tagsService.getTagGroupById(summary.id);
            const group = details[0];
            // Map each tag ID to its group name
            group.tags.forEach((tag) => {
              tagMap.set(tag.id, group.name);
            });
          } catch (err) {
            console.error(`Failed to fetch details for group ${summary.id}:`, err);
          }
        })
      );

      setTagGroupMap(tagMap);

      // Now fetch PVs
      await fetchInitialPVs(tagMap);
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    }
  };

  const fetchInitialPVs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pvService.findPVsPaged({
        pvName: '',
        pageSize: PAGE_SIZE,
      });

      const formattedPVs = formatPVs(response.results);
      setPVs(formattedPVs);
      setContinuationToken(response.continuationToken);
      setHasMore(!!response.continuationToken); // Has more if there's a continuation token
    } catch (err) {
      console.error('Failed to fetch PVs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load PVs');
      setPVs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePVs = async () => {
    if (!hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const response = await pvService.findPVsPaged({
        pvName: '',
        continuationToken,
        pageSize: PAGE_SIZE,
      });

      const formattedPVs = formatPVs(response.results);
      setPVs((prev) => [...prev, ...formattedPVs]);
      setContinuationToken(response.continuationToken);
      setHasMore(!!response.continuationToken); // Has more if there's a continuation token
    } catch (err) {
      console.error('Failed to load more PVs:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatPVs = (data: any[]): PV[] => {
    return data
      .filter((pv) => pv.setpointAddress)
      .map((pv) => {
        // Backend returns tags as array of objects: [{"id": "uuid", "name": "tagName", "groupId"?: "groupUuid", "groupName"?: "GroupName"}]
        // We need to organize them by group
        const tags: Record<string, Record<string, string>> = {};

        // For now, since backend doesn't include group info in tag objects,
        // we'll store all tags in a flat structure
        // This will be empty until tags are properly associated with groups by the backend
        if (pv.tags && Array.isArray(pv.tags)) {
          pv.tags.forEach((tag: any) => {
            if (typeof tag === 'object' && tag.name) {
              // Store tag by its name as both key and value
              // Since we don't have group info, we can't organize by group yet
              // This is a temporary solution
            }
          });
        }

        return {
          uuid: pv.id,
          description: pv.description || '',
          setpoint: pv.setpointAddress,
          readback: pv.readbackAddress || `${pv.setpointAddress}:RBV`,
          config: `${pv.setpointAddress}:CONFIG`,
          setpoint_data: {
            data: undefined,
            status: Status.UDF,
            severity: Severity.INVALID,
            timestamp: new Date(),
          },
          readback_data: {
            data: undefined,
            status: Status.UDF,
            severity: Severity.INVALID,
            timestamp: new Date(),
          },
          config_data: {
            data: undefined,
            status: Status.UDF,
            severity: Severity.INVALID,
            timestamp: new Date(),
          },
          device: pv.setpointAddress.split(':')[0] || 'Unknown',
          tags,
          abs_tolerance: pv.absTolerance,
          rel_tolerance: pv.relTolerance,
          creation_time: new Date(pv.createdDate),
        };
      });
  };

  const handleAddPV = async (pvData: {
    pvName: string;
    readbackName: string;
    description: string;
    absTolerance: string;
    relTolerance: string;
    selectedTags: Record<string, string>;
  }) => {
    try {
      // selectedTags contains tag IDs (UUIDs) as values, which is what the backend expects
      const tags: string[] = Object.values(pvData.selectedTags).filter((tagId) => tagId !== '');

      await pvService.createPV({
        setpointAddress: pvData.pvName,
        readbackAddress: pvData.readbackName || undefined,
        description: pvData.description || undefined,
        absTolerance: pvData.absTolerance ? parseFloat(pvData.absTolerance) : undefined,
        relTolerance: pvData.relTolerance ? parseFloat(pvData.relTolerance) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      await fetchInitialPVs(); // Refresh the list
    } catch (err) {
      console.error('Failed to add PV:', err);
      throw err; // Re-throw to let the UI handle the error
    }
  };

  const handleImportPVs = () => {
    alert('Import PVs functionality - to be implemented');
  };

  const handleDeletePV = async (pv: PV) => {
    if (!confirm(`Delete PV ${pv.setpoint}?`)) return;

    try {
      await pvService.deletePV(pv.uuid);
      await fetchInitialPVs(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete PV:', err);
      alert('Failed to delete PV: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handlePVClick = (pv: PV) => {
    console.log('PV clicked:', pv);
  };

  if (loading) {
    return <div>Loading PVs...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <PVBrowserPage
        pvs={pvs}
        onAddPV={handleAddPV}
        onImportPVs={handleImportPVs}
        onDeletePV={handleDeletePV}
        onPVClick={handlePVClick}
      />
      {hasMore && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <button
            onClick={loadMorePVs}
            disabled={isLoadingMore}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: isLoadingMore ? 'not-allowed' : 'pointer',
              backgroundColor: isLoadingMore ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            {isLoadingMore ? 'Loading...' : `Load More (${pvs.length} loaded)`}
          </button>
        </div>
      )}
    </div>
  );
}
