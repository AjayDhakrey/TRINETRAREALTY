import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { PORT, MONGODB_URI } from './config';
import { connectMongoDB, isMongoConnected } from './db/mongo';
import { corsMiddleware } from './middleware/cors';
import { apiRouter } from './routes';
import { initWhatsApp } from './services/whatsappService';

const BACKEND_ROOT = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();

  // Initialize MongoDB connection (falls back cleanly to JSON database if URI unavailable)
  await connectMongoDB(MONGODB_URI);

  // Body Parsers (up to 25MB for architectural plate and photography uploads)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Cross-Origin Resource Sharing (CORS)
  app.use(corsMiddleware);

  // Serve generated images directly from /src/assets/images in both dev and production
  const assetsImagesPath = path.resolve(BACKEND_ROOT, '../frontend/src/assets/images');
  if (fs.existsSync(assetsImagesPath)) {
    app.use('/src/assets/images', (req, res, next) => {
      if ('import' in req.query) {
        next();
        return;
      }
      express.static(assetsImagesPath)(req, res, next);
    });
  }

  // Mount API Master Router
  app.use('/api', apiRouter);

  // Start HTTP listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trinetra Realty Real Estate Server running on http://localhost:${PORT}`);
    console.log(`Storage Engine: ${isMongoConnected() ? '🍃 MongoDB' : '📁 JSON File Storage'}`);

    // Auto-initialize WhatsApp automation socket
    void initWhatsApp(false);
  });
}

startServer();
