import { Router } from 'express';
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/leadController';
import { requireAdminAuth } from '../middleware/auth';

export const leadRouter = Router();

// Lead submission (public customer inquiries, valuations, visits)
leadRouter.post('/leads', createLead);

// Lead management (admin only)
leadRouter.get('/leads', requireAdminAuth, getLeads);
leadRouter.patch('/leads/:id', requireAdminAuth, updateLead);
leadRouter.delete('/leads/:id', requireAdminAuth, deleteLead);

