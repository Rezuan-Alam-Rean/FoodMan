// delivery zone route definitions
import { Router } from 'express';
import {
  handleGetZones,
  handleCreateZone,
  handleUpdateZone,
  handleCreateSubzone,
  handleUpdateSubzone,
} from './zone.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';

const router = Router();

// public zone listing with fixed fees
router.get('/', handleGetZones);

// admin zone and subzone management routes
router.post('/', authenticate, authorize(USER_ROLES.ADMIN), handleCreateZone);
router.put('/:id', authenticate, authorize(USER_ROLES.ADMIN), handleUpdateZone);
router.post('/:zoneId/subzones', authenticate, authorize(USER_ROLES.ADMIN), handleCreateSubzone);
router.put('/subzones/:subzoneId', authenticate, authorize(USER_ROLES.ADMIN), handleUpdateSubzone);

export default router;
