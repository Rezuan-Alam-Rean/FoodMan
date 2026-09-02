// upload module route definitions
import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '../../constants/index.js';
import { upload } from './upload.multer.js';
import {
  handleCreateUploadConfig,
  handleGetAllUploadConfigs,
  handleGetUploadConfigById,
  handleUpdateUploadConfig,
  handleDeleteUploadConfig,
  handleResetUploadConfigLoad,
  handleUploadImage,
} from './upload.controller.js';

const router = Router();


// POST /api/upload
// accepts multipart/form-data with field name "image"
router.post(
  '/',
  authenticate,
  upload.single('image'),
  handleUploadImage
);

router.post(
  '/configs',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleCreateUploadConfig
);

// GET /api/upload/configs
router.get(
  '/configs',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleGetAllUploadConfigs
);

// GET /api/upload/configs/:configId
router.get(
  '/configs/:configId',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleGetUploadConfigById
);

// PATCH /api/upload/configs/:configId
router.patch(
  '/configs/:configId',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleUpdateUploadConfig
);

// DELETE /api/upload/configs/:configId
router.delete(
  '/configs/:configId',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleDeleteUploadConfig
);

// PATCH /api/upload/configs/:configId/reset-load
router.patch(
  '/configs/:configId/reset-load',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  handleResetUploadConfigLoad
);

export default router;
