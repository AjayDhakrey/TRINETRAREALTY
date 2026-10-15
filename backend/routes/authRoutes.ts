import { Router } from 'express';
import { login, logout } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/admin/login', login);
authRouter.post('/admin/logout', logout);

