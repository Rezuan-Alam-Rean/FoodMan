// order lifecycle route definitions
import { Router } from 'express';
import {
  handleCreateOrder,
  handleGetOrderStatus,
  handleCancelOrder,
  handleGetRestaurantLiveOrders,
  handleRiderAcceptOrder,
  handleRestaurantAcceptAndCook,
  handleRestaurantFoodReady,
  handleRiderPickupOrder,
  handleRiderDeliverOrder,
} from './order.controller.js';
import {
  authenticate,
  optionalAuthenticate,
  authorize,
} from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// place order (accessible to guest customers and logged in users)
router.post('/', optionalAuthenticate, handleCreateOrder);

// live order status tracking (http short polling for customer)
router.get('/:id/status', handleGetOrderStatus);

// cancel order (locked once cooking begins)
router.post('/:id/cancel', authenticate, handleCancelOrder);

// restaurant live order desk (http short polling)
router.get(
  '/restaurant/:restaurantId/live',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleGetRestaurantLiveOrders
);

// restaurant actions
router.post(
  '/:id/restaurant-accept',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleRestaurantAcceptAndCook
);

router.post(
  '/:id/restaurant-ready',
  authenticate,
  authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN),
  handleRestaurantFoodReady
);

// rider delivery actions
router.post(
  '/:id/rider-accept',
  authenticate,
  authorize(USER_ROLES.RIDER, USER_ROLES.ADMIN),
  handleRiderAcceptOrder
);

router.post(
  '/:id/rider-pickup',
  authenticate,
  authorize(USER_ROLES.RIDER, USER_ROLES.ADMIN),
  handleRiderPickupOrder
);

router.post(
  '/:id/rider-deliver',
  authenticate,
  authorize(USER_ROLES.RIDER, USER_ROLES.ADMIN),
  handleRiderDeliverOrder
);

export default router;
