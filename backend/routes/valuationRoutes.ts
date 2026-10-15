import { Router } from 'express';
import { calculateValuation } from '../controllers/valuationController';

export const valuationRouter = Router();

valuationRouter.post('/valuation/calculate', calculateValuation);

