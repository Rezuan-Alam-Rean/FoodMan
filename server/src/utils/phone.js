// phone number sanitization and normalization utility for bangladesh mobile numbers

/**
 * normalize bangladesh phone numbers to standard 11 digit format (01xxxxxxxxx)
 * @param {string} phone 
 * @returns {string|null}
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // strip whitespace, hyphens, parentheses, and leading plus sign
  let cleaned = phone.replace(/[\s\-()+]/g, '');

  // strip international prefix if present (880)
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.slice(2);
  }

  // prepend leading zero if missing for 10 digit input starting with 1
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = `0${cleaned}`;
  }

  // validate 11 digit format starting with bangladesh operator prefixes (013 to 019)
  const bdMobileRegex = /^01[3-9]\d{8}$/;
  if (!bdMobileRegex.test(cleaned)) {
    return null;
  }

  return cleaned;
};

/**
 * check if a given phone number is valid for bangladesh
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidBDPhone = (phone) => {
  return normalizePhoneNumber(phone) !== null;
};
