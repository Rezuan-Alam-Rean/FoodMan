// menu category and food item route definitions
import { Router } from 'express';
import {
  handleCreateCategory,
  handleUpdateCategory,
  handleCreateFoodItem,
  handleUpdateFoodItem,
  handleDeleteFoodItem,
} from './menu.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// all menu editing routes require vendor or admin role
router.use(authenticate, authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN));

router.post('/restaurants/:restaurantId/categories', handleCreateCategory);
router.put('/categories/:categoryId', handleUpdateCategory);

router.post('/restaurants/:restaurantId/items', handleCreateFoodItem);
router.put('/items/:itemId', handleUpdateFoodItem);
router.delete('/items/:itemId', handleDeleteFoodItem);

export default router;
