import { Router } from 'express';
import { healthRouter } from './healthRoutes';
import { projectRouter } from './projectRoutes';
import { propertyRouter } from './propertyRoutes';
import { leadRouter } from './leadRoutes';
import { valuationRouter } from './valuationRoutes';
import { mediaRouter } from './mediaRoutes';
import { authRouter } from './authRoutes';
import { whatsappRouter } from './whatsappRoutes';
import { realtimeRouter } from './realtimeRoutes';
import { homepageRouter } from './homepageRoutes';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(projectRouter);
apiRouter.use(propertyRouter);
apiRouter.use(leadRouter);
apiRouter.use(valuationRouter);
apiRouter.use(mediaRouter);
apiRouter.use(authRouter);
apiRouter.use(whatsappRouter);
apiRouter.use(realtimeRouter);
apiRouter.use(homepageRouter);
