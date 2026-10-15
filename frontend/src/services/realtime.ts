/**
 * Real-Time Client Service
 * Connects to Server-Sent Events (SSE) stream (/api/events)
 * and synchronizes cross-tab via BroadcastChannel.
 * Provides listener registration for UI reactivity across all devices & tabs.
 */

type RealtimeListener = (data: any) => void;

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<RealtimeListener>> = new Map();
  private reconnectTimer: any = null;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('trinetra_realtime');
          this.broadcastChannel.onmessage = (event) => {
            const { type, data } = event.data || {};
            if (type) {
              this.dispatchLocal(type, data);
            }
          };
        }
      } catch (err) {
        console.warn('BroadcastChannel not supported or restricted:', err);
      }
      this.connect();
    }
  }

  public connect(): void {
    if (typeof window === 'undefined' || this.isConnecting || this.eventSource) return;

    this.isConnecting = true;
    try {
      // Connect to SSE stream
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        // console.log('📡 [RealTime] Connected to Trinetra SSE stream');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event) {
            this.dispatchLocal(parsed.event, parsed.data);
            // Re-broadcast to local tabs
            if (this.broadcastChannel) {
              this.broadcastChannel.postMessage({ type: parsed.event, data: parsed.data });
            }
          }
        } catch {
          // Heartbeat or ping
        }
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect with exponential backoff / jitter (3-5s)
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 4000);
        }
      };
    } catch (err) {
      this.isConnecting = false;
      console.warn('RealTime SSE connection failed:', err);
    }
  }

  /**
   * Broadcast an event to other tabs on the same client browser immediately
   */
  public broadcastLocally(event: string, data: any): void {
    this.dispatchLocal(event, data);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: event, data });
      } catch (err) {
        console.warn('Failed to postMessage to BroadcastChannel:', err);
      }
    }
  }

  private dispatchLocal(event: string, data: any): void {
    const directSet = this.listeners.get(event);
    if (directSet) {
      directSet.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in realtime listener for ${event}:`, err);
        }
      });
    }

    // Also support wildcard prefix matching, e.g. "project:*" matching "project:updated"
    const prefix = event.split(':')[0] + ':*';
    const wildcardSet = this.listeners.get(prefix);
    if (wildcardSet) {
      wildcardSet.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in realtime wildcard listener for ${prefix}:`, err);
        }
      });
    }

    // Global listener "*"
    const allSet = this.listeners.get('*');
    if (allSet) {
      allSet.forEach((cb) => {
        try {
          cb({ event, data });
        } catch (err) {
          console.error('Error in global realtime listener:', err);
        }
      });
    }
  }

  /**
   * Subscribe to a specific real-time event
   * Returns an unsubscribe callback function
   */
  public subscribe(event: string, callback: RealtimeListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }
}

export const realtimeClient = new RealtimeClient();

