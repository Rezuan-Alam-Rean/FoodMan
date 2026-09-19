// restaurant route definitions
import { Router } from 'express';
import {
  handleGetRestaurants,
  handleGetRestaurantDetails,
  handleGetMyRestaurant,
  handleCreateRestaurant,
  handleToggleRestaurantStatus,
  handleBulkToggleRestaurantStatus,
  handleUpdateRestaurantProfile,
} from './restaurant.controller.js';
import { authenticate, authorize, optionalAuthenticate } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// public catalog discovery routes
router.get('/', handleGetRestaurants);
router.get('/:idOrSlug', optionalAuthenticate, handleGetRestaurantDetails);

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

// admin bulk restaurant status update (must precede /:id)
router.put(
  '/bulk-status',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleBulkToggleRestaurantStatus
);

router.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleUpdateRestaurantProfile
);

router.put(
  '/:id/status',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleToggleRestaurantStatus
);

export default router;

