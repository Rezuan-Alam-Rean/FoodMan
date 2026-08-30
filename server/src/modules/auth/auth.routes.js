// authentication route definitions
import { Router } from 'express';
import {
  handleGuestCheckoutAuth,
  handleRegister,
  handleLogin,
  handleGetMe,
  handleSetPassword,
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

// public authentication routes
router.post('/guest-auth', handleGuestCheckoutAuth);
router.post('/register', handleRegister);
router.post('/login', handleLogin);

// protected user profile routes
router.get('/me', authenticate, handleGetMe);
router.post('/set-password', authenticate, handleSetPassword);

export default router;
