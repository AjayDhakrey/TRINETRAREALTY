import { Response } from 'express';

// Active Server-Sent Events (SSE) subscriber connections
const clients = new Set<Response>();

// 25-second heartbeat timer prevents intermediate proxies and browsers from terminating idle SSE connections
let heartbeatTimer: NodeJS.Timeout | null = null;

function ensureHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const client of clients) {
      try {
        client.write(': heartbeat\n\n');
      } catch {
        clients.delete(client);
      }
    }
  }, 25000);
}

/**
 * Registers an active client HTTP response stream for real-time Server-Sent Events.
 */
export function registerSSEClient(res: Response): () => void {
  clients.add(res);
  ensureHeartbeat();

  return () => {
    clients.delete(res);
    if (clients.size === 0 && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };
}

/**
 * Returns the count of currently connected real-time subscribers.
 */
export function getActiveClientsCount(): number {
  return clients.size;
}

/**
 * Dispatches an event with JSON payload to all active clients immediately.
 */
export function broadcastEvent(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

