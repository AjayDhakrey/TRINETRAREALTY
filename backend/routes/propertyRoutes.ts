import { Router } from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController';
import { requireAdminAuth } from '../middleware/auth';

export const propertyRouter = Router();

// Public property discovery
propertyRouter.get('/properties', getProperties);
propertyRouter.get('/properties/:id', getPropertyById);

// Admin property management
propertyRouter.post('/properties', requireAdminAuth, createProperty);
propertyRouter.put('/properties/:id', requireAdminAuth, updateProperty);
propertyRouter.delete('/properties/:id', requireAdminAuth, deleteProperty);

