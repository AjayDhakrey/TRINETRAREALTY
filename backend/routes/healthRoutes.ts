import { Router } from 'express';
import { getHealth, getDbStatus, getBootstrap } from '../controllers/healthController';

export const healthRouter = Router();

healthRouter.get('/health', getHealth);
healthRouter.get('/db/status', getDbStatus);
healthRouter.get('/bootstrap', getBootstrap);

