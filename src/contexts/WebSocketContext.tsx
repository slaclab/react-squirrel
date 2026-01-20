import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { wsService } from '../services/websocketService';
import { EpicsData } from '../types';

interface WebSocketContextValue {
  isConnected: boolean;
  subscribeToPVs: (pvNames: string[]) => void;
  unsubscribeFromPVs: (pvNames: string[]) => void;
  liveValues: Map<string, EpicsData>;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export function WebSocketProvider({
  children,
  autoConnect = true,
}: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveValues, setLiveValues] = useState<Map<string, EpicsData>>(new Map());
  const unsubscribeFns = useRef<Map<string, () => void>>(new Map());

  // Connect on mount
  useEffect(() => {
    if (autoConnect) {
      wsService.reset();
      wsService.connect();
    }

    const unsubConnection = wsService.onConnectionChange(setIsConnected);

    return () => {
      unsubConnection();
      unsubscribeFns.current.forEach((unsub) => unsub());
      unsubscribeFns.current.clear();
      wsService.disconnect();
    };
  }, [autoConnect]);

  const subscribeToPVs = useCallback((pvNames: string[]) => {
    console.log('[WSContext] subscribeToPVs called with', pvNames.length, 'PVs');
    // Register callbacks FIRST before sending subscribe message
    let newCallbacks = 0;
    pvNames.forEach((pvName) => {
      if (unsubscribeFns.current.has(pvName)) return;

      const unsub = wsService.onPVUpdate(pvName, (name, value) => {
        setLiveValues((prev) => {
          const next = new Map(prev);
          next.set(name, value);
          return next;
        });
      });

      unsubscribeFns.current.set(pvName, unsub);
      newCallbacks++;
    });
    console.log('[WSContext] Registered', newCallbacks, 'new callbacks');

    wsService.subscribeToPVs(pvNames);
  }, []);

  const unsubscribeFromPVs = useCallback((pvNames: string[]) => {
    wsService.unsubscribeFromPVs(pvNames);

    // Clean up callbacks
    pvNames.forEach((pvName) => {
      const unsub = unsubscribeFns.current.get(pvName);
      if (unsub) {
        unsub();
        unsubscribeFns.current.delete(pvName);
      }
    });

    // Remove from liveValues
    setLiveValues((prev) => {
      const next = new Map(prev);
      pvNames.forEach((pvName) => next.delete(pvName));
      return next;
    });
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        subscribeToPVs,
        unsubscribeFromPVs,
        liveValues,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export default WebSocketContext;
