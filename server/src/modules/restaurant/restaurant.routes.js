// restaurant route definitions
import { Router } from 'express';
import {
  handleGetRestaurants,
  handleGetRestaurantDetails,
  handleGetMyRestaurant,
  handleCreateRestaurant,
  handleToggleRestaurantStatus,
} from './restaurant.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// public catalog discovery routes
router.get('/', handleGetRestaurants);
router.get('/:idOrSlug', handleGetRestaurantDetails);

// vendor authenticated profile route
router.get(
  '/me/profile',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleGetMyRestaurant
);

// vendor and admin management routes
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleCreateRestaurant
);

router.put(
  '/:id/status',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleToggleRestaurantStatus
);

export default router;
