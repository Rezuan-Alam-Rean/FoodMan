// rider route definitions
import { Router } from 'express';
import {
  handleGetRiderProfile,
  handleToggleOnlineStatus,
  handleUpdateAssignedZones,
  handleGetAvailableZoneOrders,
} from './rider.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// all rider self-service routes require rider role
router.use(authenticate, authorize(USER_ROLES.RIDER));

router.get('/me', handleGetRiderProfile);
router.put('/status', handleToggleOnlineStatus);
router.put('/zones', handleUpdateAssignedZones);

// http short polling available orders endpoint
router.get('/orders/available', handleGetAvailableZoneOrders);

export default router;
