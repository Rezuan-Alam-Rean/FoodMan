// review route definitions
import { Router } from 'express';
import { handleCreateReview, handleGetRestaurantReviews } from './review.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

// public reviews lookup
router.get('/restaurants/:restaurantId', handleGetRestaurantReviews);

// authenticated customer submit review
router.post('/', authenticate, handleCreateReview);

export default router;
