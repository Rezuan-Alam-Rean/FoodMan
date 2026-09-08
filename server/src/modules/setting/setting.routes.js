// system settings route definitions
import { Router } from 'express';
import {
  handleGetSystemSettings,
  handleUpdateSystemSettings,
} from './setting.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// public settings access for checkout, cart, and guests
router.get('/', handleGetSystemSettings);

// admin settings modification
router.put('/', authenticate, authorize(USER_ROLES.ADMIN), handleUpdateSystemSettings);

export default router;
