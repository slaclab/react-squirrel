/**
 * Heartbeat Context
 *
 * Provides system-wide heartbeat status to detect if the PV monitor is alive.
 * Components can use useHeartbeat() to show warnings when data may be stale.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { heartbeatService } from '../services/heartbeatService';

interface HeartbeatContextValue {
  /** Whether the PV monitor is alive and responding */
  isMonitorAlive: boolean;
  /** How old the last heartbeat is in seconds (null if unknown) */
  heartbeatAgeSeconds: number | null;
  /** When we last checked the heartbeat */
  lastChecked: Date | null;
}

const HeartbeatContext = createContext<HeartbeatContextValue>({
  isMonitorAlive: true,
  heartbeatAgeSeconds: null,
  lastChecked: null,
});

interface HeartbeatProviderProps {
  children: ReactNode;
  /** How often to check heartbeat in ms (default: 2000) */
  pollIntervalMs?: number;
}

export function HeartbeatProvider({ children, pollIntervalMs = 2000 }: HeartbeatProviderProps) {
  const [isMonitorAlive, setIsMonitorAlive] = useState(true);
  const [heartbeatAgeSeconds, setHeartbeatAgeSeconds] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    // Start the heartbeat service
    heartbeatService.start(pollIntervalMs);

    // Subscribe to heartbeat updates
    const unsubscribe = heartbeatService.subscribe((alive, age) => {
      setIsMonitorAlive(alive);
      setHeartbeatAgeSeconds(age);
      setLastChecked(new Date());
    });

    return () => {
      unsubscribe();
      heartbeatService.stop();
    };
  }, [pollIntervalMs]);

  return (
    <HeartbeatContext.Provider value={{ isMonitorAlive, heartbeatAgeSeconds, lastChecked }}>
      {children}
    </HeartbeatContext.Provider>
  );
}

/**
 * Hook to access heartbeat status.
 *
 * @example
 * const { isMonitorAlive, heartbeatAgeSeconds } = useHeartbeat();
 * if (!isMonitorAlive) {
 *   // Show warning banner
 * }
 */
export function useHeartbeat(): HeartbeatContextValue {
  return useContext(HeartbeatContext);
}

export default HeartbeatContext;
