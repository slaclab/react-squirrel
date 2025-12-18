/**
 * Buffered Live Data Hook
 *
 * The "Game Loop" pattern for efficient live data updates:
 * 1. WebSocket messages go into a Ref buffer (no re-renders)
 * 2. setInterval flushes buffer to state every N ms
 * 3. React only re-renders at the flush interval
 *
 * This prevents render spam when receiving 40k+ PV updates.
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';

export interface PVUpdate {
  value: unknown;
  status: string | null;
  severity: number | null;
  connected: boolean;
  updated_at: number;
  units?: string;
  error?: string;
}

interface UseBufferedLiveDataOptions {
  /** WebSocket URL (defaults to /v1/ws/live) */
  wsUrl?: string;
  /** How often to flush buffer to state in ms (default: 500) */
  flushIntervalMs?: number;
  /** PV names to subscribe to */
  pvNames: string[];
  /** Whether live updates are enabled */
  enabled?: boolean;
}

interface UseBufferedLiveDataReturn {
  /** Current live values (updated on flush interval) */
  liveValues: Map<string, PVUpdate>;
  /** Whether WebSocket is connected */
  isConnected: boolean;
  /** Number of updates pending in buffer */
  pendingUpdates: number;
  /** Manually flush the buffer */
  flush: () => void;
}

/**
 * Hook for buffered live data updates via WebSocket.
 *
 * Uses a ref-based buffer to prevent re-render spam from high-frequency
 * WebSocket messages. State is only updated at the flush interval.
 *
 * @example
 * const { liveValues, isConnected } = useBufferedLiveData({
 *   pvNames: ['PV:NAME1', 'PV:NAME2'],
 *   flushIntervalMs: 500,
 *   enabled: true,
 * });
 */
export function useBufferedLiveData({
  wsUrl,
  flushIntervalMs = 500,
  pvNames,
  enabled = true,
}: UseBufferedLiveDataOptions): UseBufferedLiveDataReturn {
  // Build WebSocket URL
  const defaultWsUrl = useMemo(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/v1/ws/live`;
  }, []);

  const effectiveWsUrl = wsUrl ?? defaultWsUrl;

  // The buffer - stored in a ref to avoid re-renders on every WS message
  const updateBuffer = useRef<Map<string, PVUpdate>>(new Map());

  // The state that components actually render from
  const [liveValues, setLiveValues] = useState<Map<string, PVUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(0);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  // Stable pvNames key for dependency tracking
  const pvNamesKey = useMemo(() => JSON.stringify([...pvNames].sort()), [pvNames]);

  // Flush function - moves buffer to state (the render trigger)
  const flush = useCallback(() => {
    if (updateBuffer.current.size === 0) return;

    setLiveValues((prev) => {
      const next = new Map(prev);
      updateBuffer.current.forEach((value, key) => {
        next.set(key, value);
      });
      return next;
    });

    updateBuffer.current.clear();
    setPendingUpdates(0);
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    if (!enabled || pvNames.length === 0) {
      // Clean up if disabled
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connect = () => {
      console.log('[BufferedLiveData] Connecting to', effectiveWsUrl);
      const ws = new WebSocket(effectiveWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[BufferedLiveData] Connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Subscribe to PVs
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            pv_names: pvNames,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle different message types from backend
          if (
            message.type === 'initial' ||
            message.type === 'diff' ||
            message.type === 'snapshot'
          ) {
            // Buffer the updates - DO NOT update state here!
            const data = message.data || message.values || {};
            Object.entries(data).forEach(([pvName, value]) => {
              updateBuffer.current.set(pvName, value as PVUpdate);
            });
            setPendingUpdates(updateBuffer.current.size);
          } else if (message.type === 'heartbeat') {
            // Backend heartbeat - just keep connection alive
            console.debug('[BufferedLiveData] Heartbeat received');
          } else if (message.type === 'error') {
            console.error('[BufferedLiveData] Server error:', message.message);
          }
        } catch (err) {
          console.error('[BufferedLiveData] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[BufferedLiveData] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Reconnect with exponential backoff
        if (enabled) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          console.log(
            `[BufferedLiveData] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`
          );
          reconnectTimeoutRef.current = window.setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('[BufferedLiveData] WebSocket error:', error);
        ws.close();
      };
    };

    connect();

    return () => {
      console.log('[BufferedLiveData] Cleaning up');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [effectiveWsUrl, enabled, pvNamesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The "Game Loop" - flush buffer at regular intervals
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(flush, flushIntervalMs);
    return () => clearInterval(interval);
  }, [flush, flushIntervalMs, enabled]);

  // Update subscriptions when pvNames change (while connected)
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    console.log('[BufferedLiveData] Updating subscriptions:', pvNames.length);
    wsRef.current.send(
      JSON.stringify({
        type: 'subscribe',
        pv_names: pvNames,
      })
    );
  }, [pvNamesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    liveValues,
    isConnected,
    pendingUpdates,
    flush,
  };
}

export default useBufferedLiveData;
