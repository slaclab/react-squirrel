/* eslint-disable no-console */
/**
 * WebSocket service for real-time PV updates
 */

import { EpicsData } from '../types';

type PVUpdateCallback = (pvName: string, value: EpicsData) => void;
type ConnectionCallback = (connected: boolean) => void;

interface WebSocketMessage {
  type: 'pv_update' | 'initial_values' | 'all_values' | 'pong' | 'error';
  pvName?: string;
  value?: EpicsData;
  values?: Record<string, EpicsData>;
  count?: number;
  message?: string;
  error?: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;

  private reconnectAttempts = 0;

  private maxReconnectAttempts = 10;

  private reconnectDelay = 1000;

  private subscriptions = new Map<string, Set<PVUpdateCallback>>();

  private pendingSubscriptions: string[] = [];

  private connectionCallbacks = new Set<ConnectionCallback>();

  private isConnecting = false;

  private wsUrl: string | null = null;

  /**
   * Connect to the WebSocket server
   */
  connect(url?: string): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = url || WebSocketService.getDefaultWsUrl();
    this.wsUrl = wsUrl;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WS] Connected to', this.wsUrl);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionStatus(true);

        if (this.pendingSubscriptions.length > 0) {
          console.log('[WS] Subscribing to pending PVs:', this.pendingSubscriptions.length);
          this.subscribeToPVs(this.pendingSubscriptions);
          this.pendingSubscriptions = [];
        }

        const allPVs = Array.from(this.subscriptions.keys());
        if (allPVs.length > 0) {
          console.log('[WS] Re-subscribing to existing PVs:', allPVs.length);
          this.sendSubscribe(allPVs);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log(
            '[WS] Received message:',
            data.type,
            data.values ? `${Object.keys(data.values).length} values` : ''
          );
          this.handleMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.notifyConnectionStatus(false);
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('[WS] Connection error:', error);
        this.isConnecting = false;
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting');
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
  }

  /**
   * Reset connection state to allow fresh connection attempt
   */
  reset(): void {
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Subscribe to PV updates
   */
  subscribeToPVs(pvNames: string[]): void {
    if (pvNames.length === 0) return;

    // Initialize subscription sets for new PVs
    pvNames.forEach((pvName) => {
      if (!this.subscriptions.has(pvName)) {
        this.subscriptions.set(pvName, new Set());
      }
    });

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(pvNames);
    } else {
      // Queue for when connection is established
      this.pendingSubscriptions.push(...pvNames);
    }
  }

  /**
   * Unsubscribe from PV updates
   */
  unsubscribeFromPVs(pvNames: string[]): void {
    if (pvNames.length === 0) return;

    pvNames.forEach((pvName) => {
      this.subscriptions.delete(pvName);
    });

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'unsubscribe',
          pvNames,
        })
      );
    }
  }

  /**
   * Register a callback for PV updates
   */
  onPVUpdate(pvName: string, callback: PVUpdateCallback): () => void {
    if (!this.subscriptions.has(pvName)) {
      this.subscriptions.set(pvName, new Set());
    }
    this.subscriptions.get(pvName)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(pvName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(pvName);
          this.unsubscribeFromPVs([pvName]);
        }
      }
    };
  }

  /**
   * Register a callback for connection status changes
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // Private methods

  private static getDefaultWsUrl(): string {
    // Use same host - Vite proxy will forward WebSocket connections
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/v1/ws/pvs`;
  }

  private sendSubscribe(pvNames: string[]): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('[WS] Sending subscribe for', pvNames.length, 'PVs');
      this.socket.send(
        JSON.stringify({
          type: 'subscribe',
          pvNames,
        })
      );
    }
  }

  private handleMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case 'pv_update':
        // Single PV update
        if (data.pvName && data.value) {
          this.notifySubscribers(data.pvName, data.value);
        }
        break;
      case 'initial_values':
        // Batch of initial values after subscribe
        if (data.values) {
          Object.entries(data.values).forEach(([pvName, value]) => {
            this.notifySubscribers(pvName, value);
          });
        }
        break;
      case 'all_values':
        if (data.values) {
          Object.entries(data.values).forEach(([pvName, value]) => {
            this.notifySubscribers(pvName, value);
          });
        }
        break;
      case 'pong':
        break;
      case 'error':
        console.error('WebSocket error:', data.message || data.error);
        break;
      default:
        // Unknown message type - ignore
        break;
    }
  }

  private notifySubscribers(pvName: string, value: EpicsData): void {
    const callbacks = this.subscriptions.get(pvName);
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach((cb) => {
        try {
          cb(pvName, value);
        } catch (err) {
          console.error('Error in PV callback:', err);
        }
      });
    }
  }

  private notifyConnectionStatus(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => {
      try {
        cb(connected);
      } catch (err) {
        console.error('Error in connection callback:', err);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached - WebSocket disabled');
      return;
    }

    const delay = Math.min(this.reconnectDelay * 2 ** this.reconnectAttempts, 30000);

    // Only log first few attempts to avoid console spam
    if (this.reconnectAttempts < 3) {
      console.log(
        `[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
      );
    }

    setTimeout(() => {
      this.reconnectAttempts += 1;
      this.connect(this.wsUrl || undefined);
    }, delay);
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

export default wsService;
