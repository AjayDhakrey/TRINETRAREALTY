import { Router } from 'express';
import { getStatus, init, disconnect, testMessage } from '../controllers/whatsappController';

export const whatsappRouter = Router();

whatsappRouter.get('/whatsapp/status', getStatus);
whatsappRouter.post('/whatsapp/init', init);
whatsappRouter.post('/whatsapp/disconnect', disconnect);
whatsappRouter.post('/whatsapp/test', testMessage);

