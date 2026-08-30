// centralized api route aggregator
import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import zoneRoutes from '../modules/zone/zone.routes.js';
import addressRoutes from '../modules/address/address.routes.js';
import restaurantRoutes from '../modules/restaurant/restaurant.routes.js';
import menuRoutes from '../modules/menu/menu.routes.js';
import riderRoutes from '../modules/rider/rider.routes.js';
import orderRoutes from '../modules/order/order.routes.js';
import walletRoutes from '../modules/wallet/wallet.routes.js';
import remittanceRoutes from '../modules/remittance/remittance.routes.js';
import payoutRoutes from '../modules/payout/payout.routes.js';
import adminDeskRoutes from '../modules/admin/adminDesk.routes.js';
import reviewRoutes from '../modules/review/review.routes.js';

const router = Router();

// mount all system module routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/zones', zoneRoutes);
router.use('/addresses', addressRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/riders', riderRoutes);
router.use('/orders', orderRoutes);
router.use('/wallets', walletRoutes);
router.use('/remittances', remittanceRoutes);
router.use('/payouts', payoutRoutes);
router.use('/admin', adminDeskRoutes);
router.use('/reviews', reviewRoutes);

export default router;
