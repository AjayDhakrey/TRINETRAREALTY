import { Router } from 'express';
import { getHomepage, updateHomepage } from '../controllers/homepageController';
import { requireAdminAuth } from '../middleware/auth';

export const homepageRouter = Router();

homepageRouter.get('/homepage', getHomepage);
homepageRouter.put('/admin/homepage', requireAdminAuth, updateHomepage);
homepageRouter.patch('/admin/homepage', requireAdminAuth, updateHomepage);

