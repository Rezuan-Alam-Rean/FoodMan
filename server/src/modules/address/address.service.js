// user saved delivery address business logic
import { UserAddress } from './address.model.js';
import { User } from '../user/user.model.js';
import { Zone } from '../zone/zone.model.js';
import { Subzone } from '../zone/subzone.model.js';
import { ApiError } from '../../utils/apiError.js';
import { normalizePhoneNumber } from '../../utils/phone.js';

/**
 * get saved addresses for authenticated user
 * @param {string} userId
 * @returns {Array}
 */
export const getUserAddresses = async (userId) => {
  const addresses = await UserAddress.find({ user_id: userId })
    .populate('zone_id')
    .populate('subzone_id')
    .sort({ is_default: -1, createdAt: -1 });

  return addresses;
};

/**
 * create a new saved address for user
 * @param {string} userId
 * @param {object} payload
 * @returns {object}
 */
export const createUserAddress = async (
  userId,
  {
    zone_id,
    subzone_id = null,
    address_label = 'HOME',
    detailed_address,
    contact_person_name,
    contact_phone,
    is_default = false,
  }
) => {
  if (!detailed_address || typeof detailed_address !== 'string' || !detailed_address.trim()) {
    throw ApiError.badRequest('detailed_address is required');
  }

  let resolvedName = contact_person_name;
  let resolvedPhone = contact_phone;

  if (!resolvedName || !resolvedPhone) {
    const user = await User.findById(userId);
    if (user) {
      if (!resolvedName) resolvedName = user.name;
      if (!resolvedPhone) resolvedPhone = user.phone_number;
    }
  }

  if (!resolvedName || typeof resolvedName !== 'string' || !resolvedName.trim()) {
    throw ApiError.badRequest('contact_person_name is required');
  }

  const zone = await Zone.findById(zone_id);
  if (!zone) {
    throw ApiError.badRequest('specified delivery zone does not exist');
  }

  if (!subzone_id) {
    throw ApiError.badRequest('delivery subzone is required');
  }

  const subzone = await Subzone.findById(subzone_id);
  if (!subzone || subzone.zone_id.toString() !== zone._id.toString()) {
    throw ApiError.badRequest('specified subzone does not exist or does not belong to selected zone');
  }

  const normalizedPhone = normalizePhoneNumber(resolvedPhone);
  if (!normalizedPhone) {
    throw ApiError.badRequest('invalid contact phone number');
  }

  // check if combination of zone_id and subzone_id already exists for this user
  const existingAddress = await UserAddress.findOne({
    user_id: userId,
    zone_id,
    subzone_id,
  });

  // set all existing addresses default flag to false
  await UserAddress.updateMany({ user_id: userId, is_default: true }, { $set: { is_default: false } });

  if (existingAddress) {
    existingAddress.detailed_address = detailed_address.trim();
    if (address_label) existingAddress.address_label = address_label;
    existingAddress.contact_person_name = resolvedName.trim();
    existingAddress.contact_phone = normalizedPhone;
    existingAddress.is_default = true;
    await existingAddress.save();
    return existingAddress.populate(['zone_id', 'subzone_id']);
  }

  const address = await UserAddress.create({
    user_id: userId,
    zone_id,
    subzone_id,
    address_label,
    detailed_address: detailed_address.trim(),
    contact_person_name: resolvedName.trim(),
    contact_phone: normalizedPhone,
    is_default: true,
  });

  return address.populate(['zone_id', 'subzone_id']);
};

/**
 * update user address
 * @param {string} userId
 * @param {string} addressId
 * @param {object} updates
 * @returns {object}
 */
export const updateUserAddress = async (userId, addressId, updates = {}) => {
  const address = await UserAddress.findOne({ _id: addressId, user_id: userId });
  if (!address) {
    throw ApiError.notFound('saved address not found');
  }

  if (updates.is_default) {
    await UserAddress.updateMany({ user_id: userId, is_default: true }, { $set: { is_default: false } });
    address.is_default = true;
  }

  if (updates.zone_id !== undefined || updates.subzone_id !== undefined) {
    const targetZoneId = updates.zone_id || address.zone_id;
    const targetSubzoneId = updates.subzone_id || address.subzone_id;
    if (!targetSubzoneId) {
      throw ApiError.badRequest('delivery subzone is required');
    }
    const subzone = await Subzone.findById(targetSubzoneId);
    if (!subzone || subzone.zone_id.toString() !== targetZoneId.toString()) {
      throw ApiError.badRequest('specified subzone does not belong to selected zone');
    }
    if (updates.zone_id) address.zone_id = updates.zone_id;
    if (updates.subzone_id) address.subzone_id = updates.subzone_id;
  }

  if (updates.detailed_address !== undefined) {
    if (typeof updates.detailed_address !== 'string' || !updates.detailed_address.trim()) {
      throw ApiError.badRequest('detailed_address must be a valid string');
    }
    address.detailed_address = updates.detailed_address.trim();
  }

  if (updates.contact_person_name !== undefined) {
    if (typeof updates.contact_person_name !== 'string' || !updates.contact_person_name.trim()) {
      throw ApiError.badRequest('contact_person_name must be a valid string');
    }
    address.contact_person_name = updates.contact_person_name.trim();
  }

  if (updates.contact_phone !== undefined) {
    const norm = normalizePhoneNumber(updates.contact_phone);
    if (!norm) throw ApiError.badRequest('invalid contact phone number');
    address.contact_phone = norm;
  }

  if (updates.address_label !== undefined) {
    address.address_label = updates.address_label;
  }

  await address.save();
  return address.populate(['zone_id', 'subzone_id']);
};

/**
 * delete saved address
 * @param {string} userId
 * @param {string} addressId
 */
export const deleteUserAddress = async (userId, addressId) => {
  const address = await UserAddress.findOneAndDelete({ _id: addressId, user_id: userId });
  if (!address) {
    throw ApiError.notFound('saved address not found');
  }

  // if the deleted address was default, promote the most recently updated remaining address to default
  if (address.is_default) {
    const latestAddress = await UserAddress.findOne({ user_id: userId }).sort({
      updatedAt: -1,
      createdAt: -1,
    });
    if (latestAddress) {
      latestAddress.is_default = true;
      await latestAddress.save();
    }
  }

  return true;
};
