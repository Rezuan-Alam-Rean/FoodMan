// menu category and food item route definitions
import { Router } from 'express';
import {
  handleGetAllCategories,
  handleGetAllFoodItems,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleCreateFoodItem,
  handleUpdateFoodItem,
  handleDeleteFoodItem,
} from './menu.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// public category and food item catalog endpoints
router.get('/categories', handleGetAllCategories);
router.get('/items', handleGetAllFoodItems);

// admin global category management routes
router.post(
  '/categories',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleCreateCategory
);
router.put(
  '/categories/:categoryId',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleUpdateCategory
);
router.delete(
  '/categories/:categoryId',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleDeleteCategory
);

// restaurant food item management routes (vendor or admin)
router.post(
  '/restaurants/:restaurantId/items',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleCreateFoodItem
);
router.put(
  '/items/:itemId',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleUpdateFoodItem
);
router.delete(
  '/items/:itemId',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleDeleteFoodItem
);

export default router;

