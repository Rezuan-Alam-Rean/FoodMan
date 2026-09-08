// system settings service logic
import { SystemSetting } from './setting.model.js';
import { ApiError } from '../../utils/apiError.js';
import { HTTP_STATUS } from '../../constants/index.js';

/**
 * get system settings (publicly accessible for checkout/cart)
 */
export const getPublicSystemSettings = async () => {
  const settings = await SystemSetting.getSettings();
  return settings;
};

/**
 * update system settings (admin role only)
 */
export const updateSystemSettings = async (updates = {}) => {
  const settings = await SystemSetting.getSettings();

  if (updates.platform_service_fee !== undefined) {
    const rawFee = updates.platform_service_fee;
    const fee = typeof rawFee === 'string' ? Number(rawFee.trim()) : rawFee;
    if (
      typeof rawFee === 'boolean' ||
      rawFee === null ||
      (typeof rawFee === 'string' && rawFee.trim() === '') ||
      typeof fee !== 'number' ||
      !Number.isFinite(fee) ||
      fee < 0
    ) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'platform service fee must be a valid non-negative number');
    }
    settings.platform_service_fee = fee;
  }

  if (updates.official_mfs_number !== undefined) {
    const mfs = String(updates.official_mfs_number).trim();
    if (!mfs) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'official MFS number cannot be empty');
    }
    settings.official_mfs_number = mfs;
  }

  if (updates.official_mfs_provider !== undefined) {
    settings.official_mfs_provider = String(updates.official_mfs_provider).trim();
  }

  if (updates.official_mfs_instructions !== undefined) {
    settings.official_mfs_instructions = String(updates.official_mfs_instructions).trim();
  }

  if (updates.is_mfs_active !== undefined) {
    settings.is_mfs_active = Boolean(updates.is_mfs_active);
  }

  await settings.save();
  return settings;
};
