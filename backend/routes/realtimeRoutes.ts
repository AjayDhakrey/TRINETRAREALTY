import { Router, Request, Response } from 'express';
import { registerSSEClient, getActiveClientsCount } from '../services/realtimeService';

export const realtimeRouter = Router();

function handleSSE(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });

  // Initial handshake packet
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

  const unregister = registerSSEClient(res);

  req.on('close', () => {
    unregister();
  });
}

realtimeRouter.get('/events', handleSSE);
realtimeRouter.get('/realtime', handleSSE);
realtimeRouter.get('/realtime/status', (_req: Request, res: Response) => {
  res.json({
    activeSubscribers: getActiveClientsCount(),
    timestamp: new Date().toISOString(),
  });
});

