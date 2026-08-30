// json web token utility for signing and verifying authentication tokens
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * generate jwt token from payload
 * @param {object} payload 
 * @returns {string}
 */
export const signToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * verify and decode jwt token
 * @param {string} token 
 * @returns {object}
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
