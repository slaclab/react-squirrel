import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { PVBrowserPage } from '../pages';
import { PV, Severity, Status } from '../types';
import { pvService, tagsService } from '../services';
import { ParsedCSVRow, createTagMapping } from '../utils/csvParser';
import { useAdminMode } from '../contexts/AdminModeContext';

type TagGroupMap = Map<string, string>; // tagId -> groupId

// Tag group info for the page
interface TagGroupInfo {
  id: string;
  name: string;
  tags: Array<{ id: string; name: string }>;
}

// API response types
interface TagResponse {
  id: string;
  name: string;
}

interface PVResponse {
  id: string;
  setpointAddress: string | null;
  readbackAddress?: string | null;
  description?: string | null;
  tags?: TagResponse[];
  absTolerance?: number | null;
  relTolerance?: number | null;
  createdDate: string;
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

  // Convert activeFilters (by group name with tag names) to tagFilters (by group ID with tag IDs)
  const buildTagFilters = useCallback(
    (filters: Record<string, string[]>, groups: TagGroupInfo[]): Record<string, string[]> => {
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
    },
    []
  );

  // Format PVs from API response
  const formatPVs = useCallback(
    (data: PVResponse[], tagMap: TagGroupMap): PV[] =>
      data
        .filter((pv): pv is PVResponse & { setpointAddress: string } => pv.setpointAddress !== null)
        .map((pv) => {
          // Backend returns tags as array of objects: [{"id": "uuid", "name": "tagName"}]
          // We need to organize them by group using our tagMap
          const tags: Record<string, Record<string, string>> = {};

          if (pv.tags && Array.isArray(pv.tags)) {
            pv.tags.forEach((tag: TagResponse) => {
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

          const setpointAddr = pv.setpointAddress;
          return {
            uuid: pv.id,
            description: pv.description || '',
            setpoint: setpointAddr,
            readback: pv.readbackAddress || `${setpointAddr}:RBV`,
            config: `${setpointAddr}:CONFIG`,
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
            device: setpointAddr.split(':')[0] || 'Unknown',
            tags,
            abs_tolerance: pv.absTolerance ?? undefined,
            rel_tolerance: pv.relTolerance ?? undefined,
            creation_time: new Date(pv.createdDate),
          };
        }),
    [tagGroups]
  );

  // Fetch initial PVs with optional search and filters
  const fetchInitialPVs = useCallback(
    async (
      tagMap: TagGroupMap,
      searchText: string = '',
      filters: Record<string, string[]> = {},
      groups: TagGroupInfo[] = tagGroups
    ) => {
      try {
        setLoading(true);
        setError(null);

        const tagFilters = buildTagFilters(filters, groups);

        const response = await pvService.findPVsPaged({
          pvName: searchText,
          pageSize: PAGE_SIZE,
          tagFilters: Object.keys(tagFilters).length > 0 ? tagFilters : undefined,
        });

        const formattedPVs = formatPVs(response.results, tagMap);
        setPVs(formattedPVs);
        setContinuationToken(response.continuationToken);
        setHasMore(!!response.continuationToken);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch PVs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PVs');
        setPVs([]);
      } finally {
        setLoading(false);
      }
    },
    [buildTagFilters, formatPVs, tagGroups]
  );

  // Fetch tag groups and then PVs on mount
  const fetchTagGroupsAndPVs = useCallback(async () => {
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
            // eslint-disable-next-line no-console
            console.error(`Failed to fetch details for group ${summary.id}:`, err);
          }
        })
      );

      setTagGroupMap(tagMap);
      setTagGroups(groupsInfo);

      // Now fetch PVs - pass groupsInfo directly since state won't be updated yet
      await fetchInitialPVs(tagMap, '', {}, groupsInfo);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    }
  }, [fetchInitialPVs]);

  // Call fetchTagGroupsAndPVs on mount
  useEffect(() => {
    fetchTagGroupsAndPVs();
  }, [fetchTagGroupsAndPVs]);

  // Handle search query or filter changes with debouncing
  useEffect(() => {
    // Skip on initial mount (when tagGroupMap is empty)
    if (tagGroupMap.size === 0) return undefined;

    const delayTimer = setTimeout(() => {
      fetchInitialPVs(tagGroupMap, searchQuery, activeFilters);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayTimer);
  }, [searchQuery, activeFilters, tagGroupMap, fetchInitialPVs]);

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
      setHasMore(!!response.continuationToken);
    } catch (err) {
      // eslint-disable-next-line no-console
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
    buildTagFilters,
    formatPVs,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadAllPVs = useCallback(async () => {
    if (isLoadingAll) return;

    const startTime = performance.now();
    // eslint-disable-next-line no-console
    console.log('Starting to load all PVs...');

    try {
      setIsLoadingAll(true);
      let allPVs: PV[] = [];
      let token: string | undefined;
      let pageCount = 0;

      const tagFilters = buildTagFilters(activeFilters, tagGroups);

      // Load all pages
      do {
        // eslint-disable-next-line no-await-in-loop
        const response = await pvService.findPVsPaged({
          pvName: searchQuery,
          continuationToken: token,
          pageSize: PAGE_SIZE,
          tagFilters: Object.keys(tagFilters).length > 0 ? tagFilters : undefined,
        });

        const formattedPVs = formatPVs(response.results, tagGroupMap);
        allPVs = [...allPVs, ...formattedPVs];
        token = response.continuationToken;
        pageCount += 1;

        // eslint-disable-next-line no-console
        console.log(
          `Loaded page ${pageCount}: ${response.results.length} PVs (total: ${allPVs.length})`
        );
      } while (token);

      setPVs(allPVs);
      setContinuationToken(undefined);
      setHasMore(false);

      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      // eslint-disable-next-line no-console
      console.log(`Finished loading all PVs!`);
      // eslint-disable-next-line no-console
      console.log(`Total PVs loaded: ${allPVs.length}`);
      // eslint-disable-next-line no-console
      console.log(`Total pages: ${pageCount}`);
      // eslint-disable-next-line no-console
      console.log(`Time taken: ${duration} seconds`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load all PVs:', err);
    } finally {
      setIsLoadingAll(false);
    }
  }, [
    isLoadingAll,
    activeFilters,
    tagGroups,
    searchQuery,
    tagGroupMap,
    buildTagFilters,
    formatPVs,
  ]);

  const handleAddPV = useCallback(
    async (pvData: {
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

        // eslint-disable-next-line no-console
        console.log('Creating PV with payload:', payload);
        await pvService.createPV(payload);
        await fetchInitialPVs(tagGroupMap, searchQuery, activeFilters);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to add PV:', err);
        throw err;
      }
    },
    [fetchInitialPVs, tagGroupMap, searchQuery, activeFilters]
  );

  const handleImportPVs = useCallback(
    async (csvData: ParsedCSVRow[]) => {
      try {
        // Fetch tag groups to map CSV tag names to IDs
        const summaries = await tagsService.findAllTagGroups();
        const fetchedTagGroupsPromises = summaries.map(async (summary) => {
          try {
            const details = await tagsService.getTagGroupById(summary.id);
            return details[0];
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Failed to fetch details for group ${summary.id}:`, err);
            return null;
          }
        });
        const fetchedTagGroups = await Promise.all(fetchedTagGroupsPromises);

        const validTagGroups = fetchedTagGroups.filter(
          (g): g is NonNullable<typeof g> => g !== null
        );

        // Convert each CSV row to NewPVElementDTO format
        const pvPayloads = csvData.map((row) => {
          // Map CSV tag groups to backend tag IDs
          const tagMapping = createTagMapping(row.groups, validTagGroups);
          const tags = tagMapping.tagIds;

          return {
            setpointAddress: row.Setpoint || row.Readback,
            readbackAddress:
              row.Readback && row.Readback !== row.Setpoint ? row.Readback : undefined,
            description: row.Description || undefined,
            tags: tags.length > 0 ? tags : undefined,
          };
        });

        // eslint-disable-next-line no-console
        console.log('Importing PVs:', pvPayloads);
        await pvService.createMultiplePVs(pvPayloads);

        // Refresh the PV list
        await fetchInitialPVs(tagGroupMap, searchQuery, activeFilters);

        // eslint-disable-next-line no-alert
        alert(`Successfully imported ${csvData.length} PV${csvData.length !== 1 ? 's' : ''}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to import PVs:', err);
        throw err;
      }
    },
    [fetchInitialPVs, tagGroupMap, searchQuery, activeFilters]
  );

  const handleDeletePV = useCallback(
    async (pv: PV) => {
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Delete PV ${pv.setpoint}?`)) return;

      try {
        await pvService.deletePV(pv.uuid);
        await fetchInitialPVs(tagGroupMap, searchQuery, activeFilters);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete PV:', err);
        // eslint-disable-next-line no-alert
        alert(`Failed to delete PV: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [fetchInitialPVs, tagGroupMap, searchQuery, activeFilters]
  );

  const handleUpdatePV = useCallback(
    async (
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
        await fetchInitialPVs(tagGroupMap, searchQuery, activeFilters);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to update PV:', err);
        throw err;
      }
    },
    [fetchInitialPVs, tagGroupMap, searchQuery, activeFilters]
  );

  const handlePVClick = useCallback((pv: PV) => {
    // eslint-disable-next-line no-console
    console.log('PV clicked:', pv);
  }, []);

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

export const Route = createFileRoute('/pv-browser')({
  component: PVBrowser,
});
