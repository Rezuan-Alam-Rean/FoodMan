// authentication business logic and guest checkout account resolution
import bcrypt from 'bcryptjs';
import { User } from '../user/user.model.js';
import { Wallet } from '../wallet/wallet.model.js';
import { Rider } from '../rider/rider.model.js';
import { UserAddress } from '../address/address.model.js';
import { normalizePhoneNumber } from '../../utils/phone.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/apiError.js';
import { USER_ROLES } from '../../constants/index.js';

/**
 * resolve or create customer account during guest checkout
 * @param {object} payload
 * @returns {object}
 */
export const resolveGuestCheckoutAuth = async ({
  name,
  phone_number,
  zone_id,
  subzone_id,
  detailed_address,
}) => {
  const normalizedPhone = normalizePhoneNumber(phone_number);
  if (!normalizedPhone) {
    throw ApiError.badRequest('invalid bangladesh mobile number format');
  }

  let user = await User.findOne({ phone_number: normalizedPhone });

  if (user) {
    // update customer name if provided
    if (name && name.trim() && user.name !== name.trim()) {
      user.name = name.trim();
      await user.save();
    }
  } else {
    // create new customer account automatically
    user = await User.create({
      name: name?.trim() || `Customer-${normalizedPhone.slice(-4)}`,
      phone_number: normalizedPhone,
      role: USER_ROLES.CUSTOMER,
    });
  }

  // save address if zone, subzone, and address details are provided
  let address = null;
  if (zone_id && subzone_id && detailed_address) {
    await UserAddress.updateMany(
      { user_id: user._id, is_default: true },
      { $set: { is_default: false } }
    );

    const existingAddress = await UserAddress.findOne({
      user_id: user._id,
      zone_id,
      subzone_id,
    });

    if (existingAddress) {
      existingAddress.detailed_address = detailed_address.trim();
      existingAddress.contact_person_name = user.name;
      existingAddress.contact_phone = normalizedPhone;
      existingAddress.is_default = true;
      await existingAddress.save();
      address = existingAddress;
    } else {
      address = await UserAddress.create({
        user_id: user._id,
        zone_id,
        subzone_id,
        detailed_address: detailed_address.trim(),
        contact_person_name: user.name,
        contact_phone: normalizedPhone,
        is_default: true,
      });
    }
  }

  const token = signToken({
    id: user._id,
    role: user.role,
    phone_number: user.phone_number,
  });

  const userWithPassword = await User.findById(user._id).select('+password_hash');
  const userObj = user.toJSON();
  userObj.has_password = Boolean(userWithPassword?.password_hash);

  return {
    user: userObj,
    token,
    address,
  };
};

/**
 * register standard customer account
 * @param {object} payload
 * @returns {object}
 */
export const registerUser = async ({
  name,
  phone_number,
  email,
  password,
}) => {
  const normalizedPhone = normalizePhoneNumber(phone_number);
  if (!normalizedPhone) {
    throw ApiError.badRequest('invalid bangladesh mobile number format');
  }

  const existingPhone = await User.findOne({ phone_number: normalizedPhone });
  if (existingPhone) {
    throw ApiError.conflict('a user with this phone number already exists');
  }

  if (email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      throw ApiError.conflict('a user with this email already exists');
    }
  }

  // all public self-registrations are strictly created as CUSTOMER
  const userData = {
    name: name.trim(),
    phone_number: normalizedPhone,
    role: USER_ROLES.CUSTOMER,
  };

  if (email) {
    userData.email = email.toLowerCase().trim();
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    userData.password_hash = await bcrypt.hash(password, salt);
  }

  const user = await User.create(userData);

  const token = signToken({
    id: user._id,
    role: user.role,
    phone_number: user.phone_number,
  });

  const userObj = user.toJSON();
  userObj.has_password = Boolean(password);

  return {
    user: userObj,
    token,
  };
};

/**
 * login user with phone number and password
 * @param {string} payloadOrPhone
 * @param {string} optionalPassword
 * @returns {object}
 */
export const loginUser = async (payloadOrPhone, optionalPassword) => {
  const phone = typeof payloadOrPhone === 'object' ? payloadOrPhone.phone_number : payloadOrPhone;
  const password = typeof payloadOrPhone === 'object' ? payloadOrPhone.password : optionalPassword;

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    throw ApiError.badRequest('invalid bangladesh mobile number format');
  }

  const user = await User.findOne({ phone_number: normalizedPhone }).select('+password_hash');
  if (!user) {
    throw ApiError.unauthorized('invalid phone number or credentials');
  }

  if (!user.password_hash) {
    throw ApiError.unauthorized('password login is not configured for this account; please use guest checkout or set a password');
  }

  if (!password) {
    throw ApiError.badRequest('password is required');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('invalid phone number or credentials');
  }

  const token = signToken({
    id: user._id,
    role: user.role,
    phone_number: user.phone_number,
  });

  const userObj = user.toJSON();
  userObj.has_password = true;

  return {
    user: userObj,
    token,
  };
};

/**
 * get current authenticated user profile
 * @param {string} userId
 * @returns {object}
 */
export const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId).select('+password_hash');
  if (!user) {
    throw ApiError.notFound('user not found');
  }

  let wallet = null;
  let riderProfile = null;

  if (user.role === USER_ROLES.RESTAURANT_OWNER || user.role === USER_ROLES.RIDER) {
    wallet = await Wallet.findOne({ user_id: user._id });
  }

  if (user.role === USER_ROLES.RIDER) {
    riderProfile = await Rider.findOne({ user_id: user._id }).populate('assigned_zones');
  }

  const hasPassword = Boolean(user.password_hash);
  const userObj = user.toJSON();
  userObj.has_password = hasPassword;

  return {
    ...userObj,
    user: userObj,
    has_password: hasPassword,
    wallet,
    riderProfile,
  };
};

/**
 * set or update password for user account
 * @param {string} userId
 * @param {object} payload
 * @returns {object}
 */
export const setUserPassword = async (userId, { current_password, new_password }) => {
  if (!new_password || typeof new_password !== 'string' || new_password.length < 6) {
    throw ApiError.badRequest('new password must be at least 6 characters');
  }

  const user = await User.findById(userId).select('+password_hash');
  if (!user) {
    throw ApiError.notFound('user not found');
  }

  // if user already has a password, verify current password
  if (user.password_hash) {
    if (!current_password) {
      throw ApiError.badRequest('current password is required');
    }
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      throw ApiError.badRequest('current password is incorrect');
    }
  }

  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(new_password, salt);
  await user.save();

  return {
    success: true,
    message: 'password updated successfully',
  };
};
