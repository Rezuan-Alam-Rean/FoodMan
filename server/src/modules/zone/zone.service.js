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
  const existing = await Zone.findOne({ name: name.trim() });
  if (existing) {
    throw ApiError.conflict('a zone with this name already exists');
  }

  const zone = await Zone.create({
    name: name.trim(),
    city: city.trim(),
    fixed_delivery_fee: Number(fixed_delivery_fee),
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
export const updateZone = async (zoneId, updates) => {
  const zone = await Zone.findById(zoneId);
  if (!zone) {
    throw ApiError.notFound('zone not found');
  }

  if (updates.name && updates.name.trim() !== zone.name) {
    const existing = await Zone.findOne({ name: updates.name.trim() });
    if (existing && existing._id.toString() !== zoneId) {
      throw ApiError.conflict('a zone with this name already exists');
    }
    zone.name = updates.name.trim();
  }

  if (updates.city !== undefined) zone.city = updates.city.trim();
  if (updates.fixed_delivery_fee !== undefined) {
    zone.fixed_delivery_fee = Number(updates.fixed_delivery_fee);
  }
  if (updates.is_active !== undefined) zone.is_active = Boolean(updates.is_active);

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

  const subzone = await Subzone.create({
    zone_id: zone._id,
    name: name.trim(),
    custom_fixed_fee: custom_fixed_fee !== null && custom_fixed_fee !== undefined ? Number(custom_fixed_fee) : null,
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
export const updateSubzone = async (subzoneId, updates) => {
  const subzone = await Subzone.findById(subzoneId);
  if (!subzone) {
    throw ApiError.notFound('subzone not found');
  }

  if (updates.name && updates.name.trim() !== subzone.name) {
    const existing = await Subzone.findOne({
      zone_id: subzone.zone_id,
      name: updates.name.trim(),
    });
    if (existing && existing._id.toString() !== subzoneId) {
      throw ApiError.conflict('a subzone with this name already exists in this zone');
    }
    subzone.name = updates.name.trim();
  }

  if (updates.custom_fixed_fee !== undefined) {
    subzone.custom_fixed_fee =
      updates.custom_fixed_fee !== null ? Number(updates.custom_fixed_fee) : null;
  }
  if (updates.is_active !== undefined) {
    subzone.is_active = Boolean(updates.is_active);
  }

  await subzone.save();
  return subzone;
};
