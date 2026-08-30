// admin desk route definitions
import { Router } from 'express';
import {
  handleGetAdminDeskCounts,
  handleGetPendingMfsPayments,
  handleVerifyMfsPayment,
} from './adminDesk.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// all admin desk routes require admin role
router.use(authenticate, authorize(USER_ROLES.ADMIN));

// http short polling aggregate desk counts
router.get('/desk/counts', handleGetAdminDeskCounts);

// mfs payment verification desk
router.get('/payments/pending', handleGetPendingMfsPayments);
router.put('/payments/:paymentId/verify', handleVerifyMfsPayment);

export default router;
