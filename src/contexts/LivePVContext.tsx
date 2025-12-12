import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';
import { EpicsData } from '../types';

interface LivePVContextValue {
  isConnected: boolean;
  subscribeToPVs: (pvNames: string[]) => void;
  unsubscribeFromPVs: (pvNames: string[]) => void;
  liveValues: Map<string, EpicsData>;
  lastUpdate: Date | null;
  error: string | null;
}

const LivePVContext = createContext<LivePVContextValue | null>(null);

interface LivePVProviderProps {
  children: ReactNode;
  pollInterval?: number; // milliseconds
}

export function LivePVProvider({
  children,
  pollInterval = 2000, // Poll every 2 seconds by default
}: LivePVProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveValues, setLiveValues] = useState<Map<string, EpicsData>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribedPVs = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<number | null>(null);

  // Poll for PV values
  const pollValues = useCallback(async () => {
    const pvNames = Array.from(subscribedPVs.current);
    if (pvNames.length === 0) return;

    try {
      // Build query string with multiple pv_names params
      const params = new URLSearchParams();
      pvNames.forEach(pv => params.append('pv_names', pv));

      const response = await fetch(`${API_CONFIG.endpoints.pvs}/live?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.errorCode === 0 && data.payload) {
        const values = data.payload as Record<string, EpicsData>;
        setLiveValues(prev => {
          const next = new Map(prev);
          Object.entries(values).forEach(([pvName, value]) => {
            next.set(pvName, value);
          });
          return next;
        });
        setLastUpdate(new Date());
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error('[LivePV] Poll error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch live values');
      setIsConnected(false);
    }
  }, []);

  // Start/stop polling based on subscriptions
  useEffect(() => {
    if (subscribedPVs.current.size > 0 && !pollIntervalRef.current) {
      // Start polling
      console.log('[LivePV] Starting polling for', subscribedPVs.current.size, 'PVs');
      pollValues(); // Initial fetch
      pollIntervalRef.current = window.setInterval(pollValues, pollInterval);
    } else if (subscribedPVs.current.size === 0 && pollIntervalRef.current) {
      // Stop polling
      console.log('[LivePV] Stopping polling - no subscriptions');
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pollValues, pollInterval]);

  const subscribeToPVs = useCallback((pvNames: string[]) => {
    console.log('[LivePV] subscribeToPVs called with', pvNames.length, 'PVs');
    let added = 0;
    pvNames.forEach(pv => {
      if (!subscribedPVs.current.has(pv)) {
        subscribedPVs.current.add(pv);
        added++;
      }
    });

    if (added > 0) {
      console.log('[LivePV] Added', added, 'new PV subscriptions, total:', subscribedPVs.current.size);
      // Trigger immediate poll
      pollValues();

      // Start polling if not already running
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = window.setInterval(pollValues, pollInterval);
      }
    }
  }, [pollValues, pollInterval]);

  const unsubscribeFromPVs = useCallback((pvNames: string[]) => {
    console.log('[LivePV] unsubscribeFromPVs called with', pvNames.length, 'PVs');
    pvNames.forEach(pv => {
      subscribedPVs.current.delete(pv);
    });

    // Remove from liveValues
    setLiveValues(prev => {
      const next = new Map(prev);
      pvNames.forEach(pv => next.delete(pv));
      return next;
    });

    // Stop polling if no more subscriptions
    if (subscribedPVs.current.size === 0 && pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return (
    <LivePVContext.Provider
      value={{
        isConnected,
        subscribeToPVs,
        unsubscribeFromPVs,
        liveValues,
        lastUpdate,
        error,
      }}
    >
      {children}
    </LivePVContext.Provider>
  );
}

export function useLivePVs(): LivePVContextValue {
  const context = useContext(LivePVContext);
  if (!context) {
    throw new Error('useLivePVs must be used within a LivePVProvider');
  }
  return context;
}

export default LivePVContext;
