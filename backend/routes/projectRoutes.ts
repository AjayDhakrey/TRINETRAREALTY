import { Router } from 'express';
import {
  getPublicProjects,
  getProjectBySlugOrId,
  getAllProjectsAdmin,
  createProject,
  updateProject,
  updateProjectStatus,
  duplicateProject,
  deleteProject,
} from '../controllers/projectController';
import { requireAdminAuth } from '../middleware/auth';

export const projectRouter = Router();

// Public routes
projectRouter.get('/projects', getPublicProjects);
projectRouter.get('/projects/:slugOrId', getProjectBySlugOrId);

// Admin routes
projectRouter.get('/admin/projects', requireAdminAuth, getAllProjectsAdmin);
projectRouter.post('/admin/projects', requireAdminAuth, createProject);
projectRouter.put('/admin/projects/:id', requireAdminAuth, updateProject);
projectRouter.patch('/admin/projects/:id/status', requireAdminAuth, updateProjectStatus);
projectRouter.post('/admin/projects/:id/duplicate', requireAdminAuth, duplicateProject);
projectRouter.delete('/admin/projects/:id', requireAdminAuth, deleteProject);

