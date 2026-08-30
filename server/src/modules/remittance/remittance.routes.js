// rider cod remittance route definitions
import { Router } from 'express';
import {
  handleSubmitRemittance,
  handleGetMyRemittances,
  handleGetAdminRemittances,
  handleVerifyRemittance,
} from './remittance.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// rider remittance actions
router.post(
  '/submit',
  authenticate,
  authorize(USER_ROLES.RIDER),
  handleSubmitRemittance
);

router.get(
  '/my-history',
  authenticate,
  authorize(USER_ROLES.RIDER),
  handleGetMyRemittances
);

// admin reconciliation desk routes
router.get(
  '/admin/all',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleGetAdminRemittances
);

router.put(
  '/admin/:id/verify',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleVerifyRemittance
);

export default router;
