// admin desk route definitions
import { Router } from 'express';
import {
  handleGetAdminDeskCounts,
  handleGetPendingMfsPayments,
  handleVerifyMfsPayment,
  handleGetAdminUsersList,
  handleGetCustomerDetails,
  handleGetRiderDetails,
  handleGetRestaurantDetails,
  handleGetUserDetails,
  handleCreateAdminUser,
  handleUpdateAdminUser,
  handleGetAdminOrders,
  handleAdminCancelOrder,
} from './adminDesk.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// all admin desk routes require admin role
router.use(authenticate, authorize(USER_ROLES.ADMIN));

// http short polling aggregate desk counts
router.get('/desk/counts', handleGetAdminDeskCounts);

// platform-wide all orders desk
router.get('/orders', handleGetAdminOrders);
router.post('/orders/:id/cancel', handleAdminCancelOrder);

// mfs payment verification desk
router.get('/payments/pending', handleGetPendingMfsPayments);
router.put('/payments/:paymentId/verify', handleVerifyMfsPayment);

// user directory with role-specific stats and user creation
router.get('/users', handleGetAdminUsersList);
router.post('/users', handleCreateAdminUser);
router.put('/users/:id', handleUpdateAdminUser);

// customer deep-dive
router.get('/users/customers/:id', handleGetCustomerDetails);

// rider deep-dive
router.get('/users/riders/:id', handleGetRiderDetails);

// restaurant deep-dive
router.get('/users/restaurants/:id', handleGetRestaurantDetails);

// unified user deep-dive
router.get('/users/:id', handleGetUserDetails);

export default router;
