// admin manual payout settlement route definitions
import { Router } from 'express';
import { handleDisbursePayout, handleGetPayoutHistory } from './payout.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// all payout settlement endpoints require admin role
router.use(authenticate, authorize(USER_ROLES.ADMIN));

router.post('/settle', handleDisbursePayout);
router.get('/history', handleGetPayoutHistory);

export default router;
