import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { PVBrowserPage } from '../pages';
import { PV, Severity, Status } from '../types';
import { pvService, tagsService } from '../services';
import { ParsedCSVRow, createTagMapping } from '../utils/csvParser';
import { useAdminMode } from '../contexts/AdminModeContext';

export const Route = createFileRoute('/pv-browser')({
  component: PVBrowser,
});

type TagGroupMap = Map<string, string>; // tagId -> groupId

// Tag group info for the page
interface TagGroupInfo {
  id: string;
  name: string;
  tags: Array<{ id: string; name: string }>;
}

function PVBrowser() {
  const [pvs, setPVs] = useState<PV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continuationToken, setContinuationToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [tagGroupMap, setTagGroupMap] = useState<TagGroupMap>(new Map());
  const [tagGroups, setTagGroups] = useState<TagGroupInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const { isAdminMode } = useAdminMode();

  const PAGE_SIZE = 100; // Load 100 PVs at a time

  useEffect(() => {
    fetchTagGroupsAndPVs();
  }, []);

  // Handle search query or filter changes with debouncing
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      // When search query changes, fetch new results
      fetchInitialPVs(tagGroupMap, searchQuery, activeFilters);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayTimer);
  }, [searchQuery, activeFilters, tagGroupMap]);

  const fetchTagGroupsAndPVs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tag groups first to build the mapping
      const summaries = await tagsService.findAllTagGroups();
      const tagMap = new Map<string, string>();
      const groupsInfo: TagGroupInfo[] = [];

      await Promise.all(
        summaries.map(async (summary) => {
          try {
            const details = await tagsService.getTagGroupById(summary.id);
            const group = details[0];
            // Map each tag ID to its group ID
            group.tags.forEach((tag) => {
              tagMap.set(tag.id, group.id);
            });
            groupsInfo.push({
              id: group.id,
              name: group.name,
              tags: group.tags,
            });
          } catch (err) {
            console.error(`Failed to fetch details for group ${summary.id}:`, err);
          }
        })
      );

      setTagGroupMap(tagMap);
      setTagGroups(groupsInfo);

      // Now fetch PVs
      await fetchInitialPVs(tagMap, '', {});
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    }
  };

  // Convert activeFilters (by group name with tag names) to tagFilters (by group ID with tag IDs)
  const buildTagFilters = (
    filters: Record<string, string[]>,
    groups: TagGroupInfo[]
  ): Record<string, string[]> => {
    const tagFilters: Record<string, string[]> = {};

    Object.entries(filters).forEach(([groupName, tagNames]) => {
      if (tagNames && tagNames.length > 0) {
        // Find the group by name
        const group = groups.find((g) => g.name === groupName);
        if (group) {
          // Convert tag names to tag IDs
          const tagIds = tagNames
            .map((tagName) => {
              const tag = group.tags.find((t) => t.name === tagName);
              return tag?.id;
            })
            .filter((id): id is string => id !== undefined);

          if (tagIds.length > 0) {
            tagFilters[group.id] = tagIds;
          }
        }
      }
    });

    return tagFilters;
  };

  const fetchInitialPVs = async (
    tagMap: TagGroupMap,
    searchText: string = '',
    filters: Record<string, string[]> = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      const tagFilters = buildTagFilters(filters, tagGroups);

      const response = await pvService.findPVsPaged({
        pvName: searchText,
        pageSize: PAGE_SIZE,
        tagFilters: Object.keys(tagFilters).length > 0 ? tagFilters : undefined,
      });

      const formattedPVs = formatPVs(response.results, tagMap);
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

  const loadMorePVs = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);

      const tagFilters = buildTagFilters(activeFilters, tagGroups);

      const response = await pvService.findPVsPaged({
        pvName: searchQuery,
        continuationToken,
        pageSize: PAGE_SIZE,
        tagFilters: Object.keys(tagFilters).length > 0 ? tagFilters : undefined,
      });

      const formattedPVs = formatPVs(response.results, tagGroupMap);
      setPVs((prev) => [...prev, ...formattedPVs]);
      setContinuationToken(response.continuationToken);
      setHasMore(!!response.continuationToken); // Has more if there's a continuation token
    } catch (err) {
      console.error('Failed to load more PVs:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hasMore,
    isLoadingMore,
    searchQuery,
    continuationToken,
    tagGroupMap,
    activeFilters,
    tagGroups,
  ]);

  const loadAllPVs = async () => {
    if (isLoadingAll) return;

    const startTime = performance.now();
    console.log('Starting to load all PVs...');

    try {
      setIsLoadingAll(true);
      let allPVs: PV[] = [];
      let token: string | undefined = undefined;
      let pageCount = 0;

      const tagFilters = buildTagFilters(activeFilters, tagGroups);

      // Load all pages
      do {
        const response = await pvService.findPVsPaged({
          pvName: searchQuery,
          continuationToken: token,
          pageSize: PAGE_SIZE,
          tagFilters: Object.keys(tagFilters).length > 0 ? tagFilters : undefined,
        });

        const formattedPVs = formatPVs(response.results, tagGroupMap);
        allPVs = [...allPVs, ...formattedPVs];
        token = response.continuationToken;
        pageCount++;

        console.log(
          `Loaded page ${pageCount}: ${response.results.length} PVs (total: ${allPVs.length})`
        );
      } while (token);

      setPVs(allPVs);
      setContinuationToken(undefined);
      setHasMore(false);

      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`Finished loading all PVs!`);
      console.log(`Total PVs loaded: ${allPVs.length}`);
      console.log(`Total pages: ${pageCount}`);
      console.log(`Time taken: ${duration} seconds`);
    } catch (err) {
      console.error('Failed to load all PVs:', err);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const formatPVs = (data: any[], tagMap: TagGroupMap): PV[] => {
    return data
      .filter((pv) => pv.setpointAddress)
      .map((pv) => {
        // Backend returns tags as array of objects: [{"id": "uuid", "name": "tagName"}]
        // We need to organize them by group using our tagMap
        const tags: Record<string, Record<string, string>> = {};

        if (pv.tags && Array.isArray(pv.tags)) {
          pv.tags.forEach((tag: any) => {
            if (typeof tag === 'object' && tag.id && tag.name) {
              // Look up which group this tag belongs to
              const groupId = tagMap.get(tag.id);
              if (groupId) {
                const group = tagGroups.find((g) => g.id === groupId);
                const groupName = group?.name || groupId;
                if (!tags[groupName]) {
                  tags[groupName] = {};
                }
                // Store tag name as both key and value
                tags[groupName][tag.name] = tag.name;
              }
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
    selectedTags: Record<string, string[]>;
  }) => {
    try {
      // selectedTags contains arrays of tag IDs (UUIDs), flatten them
      const tags: string[] = Object.values(pvData.selectedTags)
        .flat()
        .filter((tagId) => tagId !== '');

      const payload = {
        setpointAddress: pvData.pvName,
        readbackAddress: pvData.readbackName || undefined,
        description: pvData.description || undefined,
        absTolerance: pvData.absTolerance ? parseFloat(pvData.absTolerance) : undefined,
        relTolerance: pvData.relTolerance ? parseFloat(pvData.relTolerance) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      console.log('Creating PV with payload:', payload);
      await pvService.createPV(payload);
      await fetchInitialPVs(tagGroupMap, searchQuery, activeFilters); // Refresh the list with current search
    } catch (err) {
      console.error('Failed to add PV:', err);
      throw err; // Re-throw to let the UI handle the error
    }
  };

  const handleImportPVs = async (csvData: ParsedCSVRow[]) => {
    try {
      // Fetch tag groups to map CSV tag names to IDs
      const summaries = await tagsService.findAllTagGroups();
      const tagGroups = await Promise.all(
        summaries.map(async (summary) => {
          try {
            const details = await tagsService.getTagGroupById(summary.id);
            return details[0];
          } catch (err) {
            console.error(`Failed to fetch details for group ${summary.id}:`, err);
            return null;
          }
        })
      );

      const validTagGroups = tagGroups.filter((g): g is NonNullable<typeof g> => g !== null);

      // Convert each CSV row to NewPVElementDTO format
      const pvPayloads = csvData.map((row) => {
        // Map CSV tag groups to backend tag IDs
        const tagMapping = createTagMapping(row.groups, validTagGroups);
        const tags = tagMapping.tagIds;

        return {
          setpointAddress: row.Setpoint || row.Readback,
          readbackAddress: row.Readback && row.Readback !== row.Setpoint ? row.Readback : undefined,
          description: row.Description || undefined,
          tags: tags.length > 0 ? tags : undefined,
        };
      });

      console.log('Importing PVs:', pvPayloads);
      await pvService.createMultiplePVs(pvPayloads);

      // Refresh the PV list
      await fetchInitialPVs(tagGroupMap, searchQuery, activeFilters);

      alert(`Successfully imported ${csvData.length} PV${csvData.length !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Failed to import PVs:', err);
      throw err; // Re-throw to let the UI handle the error
    }
  };

  const handleDeletePV = async (pv: PV) => {
    if (!confirm(`Delete PV ${pv.setpoint}?`)) return;

    try {
      await pvService.deletePV(pv.uuid);
      await fetchInitialPVs(tagGroupMap, searchQuery, activeFilters); // Refresh the list with current search
    } catch (err) {
      console.error('Failed to delete PV:', err);
      alert('Failed to delete PV: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdatePV = async (
    pvId: string,
    updates: {
      description?: string;
      absTolerance?: number;
      relTolerance?: number;
      tags?: string[];
    }
  ) => {
    try {
      await pvService.updatePV(pvId, {
        description: updates.description,
        absTolerance: updates.absTolerance,
        relTolerance: updates.relTolerance,
        tags: updates.tags,
      });
      await fetchInitialPVs(tagGroupMap, searchQuery, activeFilters); // Refresh the list
    } catch (err) {
      console.error('Failed to update PV:', err);
      throw err; // Re-throw to let the UI handle the error
    }
  };

  const handlePVClick = (pv: PV) => {
    console.log('PV clicked:', pv);
  };

  const handleFilterChange = (filters: Record<string, string[]>) => {
    setActiveFilters(filters);
  };

  if (loading && pvs.length === 0) {
    return <div>Loading PVs...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <PVBrowserPage
      pvs={pvs}
      onAddPV={handleAddPV}
      onUpdatePV={handleUpdatePV}
      onImportPVs={handleImportPVs}
      onDeletePV={handleDeletePV}
      onPVClick={handlePVClick}
      isAdmin={isAdminMode}
      searchText={searchQuery}
      onSearchChange={setSearchQuery}
      onLoadMore={loadMorePVs}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      tagGroups={tagGroups}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
    />
  );
}
