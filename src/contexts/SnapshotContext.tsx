import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from 'react';
import { snapshotService, jobService } from '../services';

export interface SnapshotProgress {
  isCreating: boolean;
  title: string | null;
  progress: number | null; // 0-100, null if indeterminate
  error: string | null;
  snapshotId: string | null;
  message: string | null;
}

interface SnapshotContextType {
  snapshotProgress: SnapshotProgress;
  startSnapshot: (title: string, comment?: string) => void;
  clearSnapshot: () => void;
}

const initialProgress: SnapshotProgress = {
  isCreating: false,
  title: null,
  progress: null,
  error: null,
  snapshotId: null,
  message: null,
};

const POLL_INTERVAL_MS = 1000; // Poll every second

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

interface SnapshotProviderProps {
  children: ReactNode;
}

export function SnapshotProvider({ children }: SnapshotProviderProps) {
  const [snapshotProgress, setSnapshotProgress] = useState<SnapshotProgress>(initialProgress);
  const pollIntervalRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollJobStatus = useCallback(
    (jobId: string, title: string) => {
      const poll = async () => {
        try {
          const job = await jobService.getJobStatus(jobId);

          if (job.status === 'completed') {
            stopPolling();
            setSnapshotProgress({
              isCreating: false,
              title,
              progress: 100,
              error: null,
              snapshotId: job.resultId || null,
              message: job.message || 'Snapshot created successfully',
            });
          } else if (job.status === 'failed') {
            stopPolling();
            setSnapshotProgress({
              isCreating: false,
              title,
              progress: null,
              error: job.error || 'Snapshot creation failed',
              snapshotId: null,
              message: null,
            });
          } else {
            // Still running or pending
            setSnapshotProgress({
              isCreating: true,
              title,
              progress: job.progress,
              error: null,
              snapshotId: null,
              message: job.message || 'Creating snapshot...',
            });
          }
        } catch (err) {
          stopPolling();
          setSnapshotProgress({
            isCreating: false,
            title,
            progress: null,
            error: err instanceof Error ? err.message : 'Failed to check job status',
            snapshotId: null,
            message: null,
          });
        }
      };

      // Start polling
      poll(); // Initial poll
      pollIntervalRef.current = window.setInterval(poll, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  const startSnapshot = useCallback(
    (title: string, comment?: string) => {
      // Stop any existing polling
      stopPolling();

      // Set initial state - creating, no progress yet
      setSnapshotProgress({
        isCreating: true,
        title,
        progress: null,
        error: null,
        snapshotId: null,
        message: 'Starting snapshot...',
      });

      // Fire off the async request
      snapshotService
        .createSnapshotAsync({
          title,
          comment: comment || undefined,
        })
        .then((result) => {
          // Start polling for job status
          pollJobStatus(result.jobId, title);
        })
        .catch((err) => {
          setSnapshotProgress({
            isCreating: false,
            title,
            progress: null,
            error: err instanceof Error ? err.message : 'Failed to start snapshot',
            snapshotId: null,
            message: null,
          });
        });
    },
    [pollJobStatus, stopPolling]
  );

  const clearSnapshot = useCallback(() => {
    stopPolling();
    setSnapshotProgress(initialProgress);
  }, [stopPolling]);

  const contextValue = useMemo(
    () => ({ snapshotProgress, startSnapshot, clearSnapshot }),
    [snapshotProgress, startSnapshot, clearSnapshot]
  );

  return <SnapshotContext.Provider value={contextValue}>{children}</SnapshotContext.Provider>;
}

export function useSnapshot(): SnapshotContextType {
  const context = useContext(SnapshotContext);
  if (!context) {
    throw new Error('useSnapshot must be used within a SnapshotProvider');
  }
  return context;
}
