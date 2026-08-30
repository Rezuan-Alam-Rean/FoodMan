// delivery zone and subzone business logic
import { Zone } from './zone.model.js';
import { Subzone } from './subzone.model.js';
import { ApiError } from '../../utils/apiError.js';

/**
 * get all active zones with populated subzones
 * @returns {Array}
 */
export const getAllActiveZones = async () => {
  const zones = await Zone.find({ is_active: true }).sort({ name: 1 });
  const subzones = await Subzone.find({ is_active: true }).sort({ name: 1 });

  // map subzones under respective zones
  const zonesWithSubzones = zones.map((zone) => {
    const zoneObj = zone.toJSON();
    zoneObj.subzones = subzones.filter(
      (sub) => sub.zone_id.toString() === zone._id.toString()
    );
    return zoneObj;
  });

  return zonesWithSubzones;
};

/**
 * create a new delivery zone (admin)
 * @param {object} payload
 * @returns {object}
 */
export const createZone = async ({ name, city = 'Dhaka', fixed_delivery_fee = 100 }) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('zone name is required');
  }

  const fee = Number(fixed_delivery_fee);
  if (!Number.isFinite(fee) || fee < 0) {
    throw ApiError.badRequest('fixed_delivery_fee must be a non-negative number');
  }

  const existing = await Zone.findOne({ name: name.trim() });
  if (existing) {
    throw ApiError.conflict('a zone with this name already exists');
  }

  const zone = await Zone.create({
    name: name.trim(),
    city: typeof city === 'string' && city.trim() ? city.trim() : 'Dhaka',
    fixed_delivery_fee: fee,
    is_active: true,
  });

  return zone;
};

/**
 * update delivery zone details and fixed fee (admin)
 * @param {string} zoneId
 * @param {object} updates
 * @returns {object}
 */
export const updateZone = async (zoneId, updates = {}) => {
  const zone = await Zone.findById(zoneId);
  if (!zone) {
    throw ApiError.notFound('zone not found');
  }

  if (updates.name !== undefined) {
    if (!updates.name || typeof updates.name !== 'string' || !updates.name.trim()) {
      throw ApiError.badRequest('zone name cannot be empty');
    }
    if (updates.name.trim() !== zone.name) {
      const existing = await Zone.findOne({ name: updates.name.trim() });
      if (existing && existing._id.toString() !== zoneId) {
        throw ApiError.conflict('a zone with this name already exists');
      }
      zone.name = updates.name.trim();
    }
  }

  if (updates.city !== undefined) {
    if (typeof updates.city !== 'string' || !updates.city.trim()) {
      throw ApiError.badRequest('city must be a valid string');
    }
    zone.city = updates.city.trim();
  }

  if (updates.fixed_delivery_fee !== undefined) {
    const fee = Number(updates.fixed_delivery_fee);
    if (!Number.isFinite(fee) || fee < 0) {
      throw ApiError.badRequest('fixed_delivery_fee must be a non-negative number');
    }
    zone.fixed_delivery_fee = fee;
  }

  if (updates.is_active !== undefined) {
    if (typeof updates.is_active !== 'boolean') {
      throw ApiError.badRequest('is_active must be a boolean value (true or false)');
    }
    zone.is_active = updates.is_active;
  }

  await zone.save();
  return zone;
};

/**
 * create subzone under a zone (admin)
 * @param {string} zoneId
 * @param {object} payload
 * @returns {object}
 */
export const createSubzone = async (zoneId, { name, custom_fixed_fee = null }) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('subzone name is required');
  }

  const zone = await Zone.findById(zoneId);
  if (!zone) {
    throw ApiError.notFound('parent zone not found');
  }

  const existing = await Subzone.findOne({
    zone_id: zone._id,
    name: name.trim(),
  });
  if (existing) {
    throw ApiError.conflict('a subzone with this name already exists in this zone');
  }

  let fee = null;
  if (custom_fixed_fee !== null && custom_fixed_fee !== undefined) {
    fee = Number(custom_fixed_fee);
    if (!Number.isFinite(fee) || fee < 0) {
      throw ApiError.badRequest('custom_fixed_fee must be a non-negative number or null');
    }
  }

  const subzone = await Subzone.create({
    zone_id: zone._id,
    name: name.trim(),
    custom_fixed_fee: fee,
    is_active: true,
  });

  return subzone;
};

/**
 * update subzone details (admin)
 * @param {string} subzoneId
 * @param {object} updates
 * @returns {object}
 */
export const updateSubzone = async (subzoneId, updates = {}) => {
  const subzone = await Subzone.findById(subzoneId);
  if (!subzone) {
    throw ApiError.notFound('subzone not found');
  }

  if (updates.name !== undefined) {
    if (!updates.name || typeof updates.name !== 'string' || !updates.name.trim()) {
      throw ApiError.badRequest('subzone name cannot be empty');
    }
    if (updates.name.trim() !== subzone.name) {
      const existing = await Subzone.findOne({
        zone_id: subzone.zone_id,
        name: updates.name.trim(),
      });
      if (existing && existing._id.toString() !== subzoneId) {
        throw ApiError.conflict('a subzone with this name already exists in this zone');
      }
      subzone.name = updates.name.trim();
    }
  }

  if (updates.custom_fixed_fee !== undefined) {
    if (updates.custom_fixed_fee === null) {
      subzone.custom_fixed_fee = null;
    } else {
      const fee = Number(updates.custom_fixed_fee);
      if (!Number.isFinite(fee) || fee < 0) {
        throw ApiError.badRequest('custom_fixed_fee must be a non-negative number or null');
      }
      subzone.custom_fixed_fee = fee;
    }
  }

  if (updates.is_active !== undefined) {
    if (typeof updates.is_active !== 'boolean') {
      throw ApiError.badRequest('is_active must be a boolean value (true or false)');
    }
    subzone.is_active = updates.is_active;
  }

  await subzone.save();
  return subzone;
};
