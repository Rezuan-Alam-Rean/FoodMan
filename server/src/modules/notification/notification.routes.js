// notification route definitions
import { Router } from 'express';
import {
  handleGetMyNotifications,
  handleGetUnreadCount,
  handleMarkAsRead,
  handleMarkAllAsRead,
} from './notification.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

// all notification routes require authenticated session
router.use(authenticate);

router.get('/', handleGetMyNotifications);
router.get('/unread-count', handleGetUnreadCount);
router.put('/read-all', handleMarkAllAsRead);
router.put('/:id/read', handleMarkAsRead);

export default router;
