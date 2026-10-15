import { Router } from 'express';
import { getMedia, createMedia, updateMedia, deleteMedia } from '../controllers/mediaController';
import { requireAdminAuth } from '../middleware/auth';

export const mediaRouter = Router();

mediaRouter.get('/media', getMedia);
mediaRouter.post('/media', requireAdminAuth, createMedia);
mediaRouter.put('/media/:id', requireAdminAuth, updateMedia);
mediaRouter.patch('/media/:id', requireAdminAuth, updateMedia);
mediaRouter.delete('/media/:id', requireAdminAuth, deleteMedia);
