// authentication business logic and guest checkout account resolution
import bcrypt from 'bcryptjs';
import { User } from '../user/user.model.js';
import { Wallet } from '../wallet/wallet.model.js';
import { Rider } from '../rider/rider.model.js';
import { UserAddress } from '../address/address.model.js';
import { normalizePhoneNumber } from '../../utils/phone.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/apiError.js';
import { USER_ROLES, USER_STATUS } from '../../constants/index.js';

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
    if (user.status === USER_STATUS.SUSPENDED) {
      throw ApiError.forbidden('account associated with this phone number is suspended');
    }

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
      status: USER_STATUS.ACTIVE,
    });
  }

  // save address if zone and address details are provided
  let address = null;
  if (zone_id && detailed_address) {
    address = await UserAddress.create({
      user_id: user._id,
      zone_id,
      subzone_id: subzone_id || null,
      detailed_address: detailed_address.trim(),
      contact_person_name: user.name,
      contact_phone: normalizedPhone,
      is_default: true,
    });
  }

  const token = signToken({
    id: user._id,
    role: user.role,
    phone_number: user.phone_number,
  });

  return {
    user,
    token,
    address,
  };
};

/**
 * register standard user (customer, vendor, rider, or admin)
 * @param {object} payload
 * @returns {object}
 */
export const registerUser = async ({
  name,
  phone_number,
  email,
  password,
  role = USER_ROLES.CUSTOMER,
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
      throw ApiError.conflict('a user with this email address already exists');
    }
  }

  let password_hash = null;
  if (password) {
    password_hash = await bcrypt.hash(password, 10);
  }

  const user = await User.create({
    name: name.trim(),
    phone_number: normalizedPhone,
    email: email ? email.toLowerCase().trim() : undefined,
    password_hash,
    role,
    status: USER_STATUS.ACTIVE,
  });

  // initialize digital wallet for vendors and riders
  if (role === USER_ROLES.RESTAURANT_OWNER || role === USER_ROLES.RIDER) {
    await Wallet.create({
      user_id: user._id,
      current_balance: 0,
      lifetime_earnings: 0,
      total_settled_by_admin: 0,
    });
  }

  // initialize rider profile if rider role
  if (role === USER_ROLES.RIDER) {
    await Rider.create({
      user_id: user._id,
      is_online: false,
      assigned_zones: [],
    });
  }

  const token = signToken({
    id: user._id,
    role: user.role,
    phone_number: user.phone_number,
  });

  return {
    user,
    token,
  };
};

/**
 * login user with phone number and password
 * @param {object} payload
 * @returns {object}
 */
export const loginUser = async ({ phone_number, password }) => {
  const normalizedPhone = normalizePhoneNumber(phone_number);
  if (!normalizedPhone) {
    throw ApiError.badRequest('invalid bangladesh mobile number format');
  }

  const user = await User.findOne({ phone_number: normalizedPhone }).select('+password_hash');
  if (!user) {
    throw ApiError.unauthorized('invalid phone number or credentials');
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('your account has been suspended');
  }

  if (user.password_hash) {
    if (!password) {
      throw ApiError.badRequest('password is required for this account');
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('invalid phone number or credentials');
    }
  }

  const token = signToken({
    id: user._id,
    role: user.role,
    phone_number: user.phone_number,
  });

  return {
    user,
    token,
  };
};

/**
 * get current authenticated user profile
 * @param {string} userId
 * @returns {object}
 */
export const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId);
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

  return {
    user,
    wallet,
    riderProfile,
  };
};
