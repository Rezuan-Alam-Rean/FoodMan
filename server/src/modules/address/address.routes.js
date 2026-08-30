// saved user address route definitions
import { Router } from 'express';
import {
  handleGetMyAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleDeleteAddress,
} from './address.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

// all address routes require authentication
router.use(authenticate);

router.get('/', handleGetMyAddresses);
router.post('/', handleCreateAddress);
router.put('/:id', handleUpdateAddress);
router.delete('/:id', handleDeleteAddress);

export default router;
