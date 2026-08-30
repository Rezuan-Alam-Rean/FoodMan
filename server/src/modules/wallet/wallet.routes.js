// digital wallet route definitions
import { Router } from 'express';
import { handleGetMyWallet, handleGetAllWallets } from './wallet.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// authenticated user wallet route (read-only for vendors and riders)
router.get('/me', authenticate, handleGetMyWallet);

// admin all partner wallets route
router.get(
  '/admin/all',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleGetAllWallets
);

export default router;
