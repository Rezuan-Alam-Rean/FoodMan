// coupon management route definitions
import { Router } from 'express';
import {
  handleCreateCoupon,
  handleGetCoupons,
  handleGetCouponById,
  handleUpdateCoupon,
  handleToggleCouponStatus,
  handleDeleteCoupon,
  handleGetCouponsByRestaurant,
  handleValidateCoupon,
} from './coupon.controller.js';
import { authenticate, optionalAuthenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// public/customer endpoints
router.post('/validate', optionalAuthenticate, handleValidateCoupon);
router.get('/restaurant/:restaurantId', handleGetCouponsByRestaurant);

// admin protected endpoints
router.post('/', authenticate, authorize(USER_ROLES.ADMIN), handleCreateCoupon);
router.get('/', authenticate, authorize(USER_ROLES.ADMIN), handleGetCoupons);
router.get('/:id', authenticate, authorize(USER_ROLES.ADMIN), handleGetCouponById);
router.patch('/:id', authenticate, authorize(USER_ROLES.ADMIN), handleUpdateCoupon);
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), handleDeleteCoupon);
router.patch('/:id/toggle-status', authenticate, authorize(USER_ROLES.ADMIN), handleToggleCouponStatus);

export default router;
