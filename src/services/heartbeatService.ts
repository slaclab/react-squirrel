/**
 * Heartbeat Service
 *
 * Polls the backend health endpoint to detect if the PV monitor is alive.
 * This catches the case where the monitor process dies silently.
 */

type HeartbeatCallback = (isAlive: boolean, ageSeconds: number | null) => void;

interface HeartbeatState {
  alive: boolean;
  age: number | null;
  timestamp: number | null;
}

class HeartbeatService {
  private pollInterval: number | null = null;
  private callbacks: Set<HeartbeatCallback> = new Set();
  private lastKnownState: HeartbeatState = {
    alive: true,
    age: null,
    timestamp: null,
  };

  /**
   * Start polling the heartbeat endpoint.
   * @param intervalMs How often to check (default: 2000ms)
   */
  start(intervalMs: number = 2000): void {
    if (this.pollInterval) return;

    this.pollInterval = window.setInterval(() => {
      this.checkHeartbeat();
    }, intervalMs);

    // Check immediately
    this.checkHeartbeat();
  }

  /**
   * Stop polling.
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Check the heartbeat endpoint.
   */
  private async checkHeartbeat(): Promise<void> {
    try {
      const response = await fetch('/v1/health/heartbeat');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Backend returns: { alive: boolean, timestamp: number | null, age_seconds: number | null }
      const alive = data.payload?.alive ?? false;
      const age = data.payload?.age_seconds ?? null;
      const timestamp = data.payload?.timestamp ?? null;

      this.lastKnownState = { alive, age, timestamp };
      this.notifyCallbacks(alive, age);
    } catch (error) {
      // Network error or backend down - assume monitor is dead
      console.warn('[HeartbeatService] Check failed:', error);
      this.lastKnownState = { alive: false, age: null, timestamp: null };
      this.notifyCallbacks(false, null);
    }
  }

  /**
   * Subscribe to heartbeat status changes.
   * @param callback Called with (isAlive, ageSeconds) on each check
   * @returns Unsubscribe function
   */
  subscribe(callback: HeartbeatCallback): () => void {
    this.callbacks.add(callback);

    // Immediately notify with current state
    callback(this.lastKnownState.alive, this.lastKnownState.age);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(alive: boolean, age: number | null): void {
    this.callbacks.forEach((cb) => cb(alive, age));
  }

  /**
   * Get the current heartbeat state.
   */
  getState(): HeartbeatState {
    return { ...this.lastKnownState };
  }

  /**
   * Check if currently polling.
   */
  isRunning(): boolean {
    return this.pollInterval !== null;
  }
}

// Singleton instance
export const heartbeatService = new HeartbeatService();
