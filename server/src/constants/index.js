// application constants and enums
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

export const NODE_ENVS = Object.freeze({
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
});

export const DB_CONNECTION_STATES = Object.freeze({
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
});

// user role constants
export const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  RESTAURANT_OWNER: 'RESTAURANT_OWNER',
  RIDER: 'RIDER',
  CUSTOMER: 'CUSTOMER',
  GUEST: 'GUEST',
});

// address label constants
export const ADDRESS_LABELS = Object.freeze({
  HOME: 'HOME',
  WORK: 'WORK',
  OTHER: 'OTHER',
});

// vehicle types for couriers
export const VEHICLE_TYPES = Object.freeze({
  BICYCLE: 'BICYCLE',
  MOTORCYCLE: 'MOTORCYCLE',
  SCOOTER: 'SCOOTER',
  WALKER: 'WALKER',
});

// order status machine constants
export const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  LOOKING_FOR_RIDER: 'LOOKING_FOR_RIDER',
  RIDER_ACCEPTED: 'RIDER_ACCEPTED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  PICKED_UP: 'PICKED_UP',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

// payment method constants
export const PAYMENT_METHODS = Object.freeze({
  COD: 'COD',
  BKASH: 'BKASH',
  NAGAD: 'NAGAD',
  ROCKET: 'ROCKET',
  UPAY: 'UPAY',
});

// payment status constants
export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

// rider cod remittance status
export const REMITTANCE_STATUS = Object.freeze({
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

// remittance payment channels
export const REMITTANCE_METHODS = Object.freeze({
  BKASH: 'BKASH',
  NAGAD: 'NAGAD',
  ROCKET: 'ROCKET',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH_DESK: 'CASH_DESK',
});

// admin payout disbursement channels
export const PAYOUT_CHANNELS = Object.freeze({
  BKASH_DISBURSEMENT: 'BKASH_DISBURSEMENT',
  NAGAD: 'NAGAD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH: 'CASH',
});

// double entry ledger transaction types
export const LEDGER_TRANSACTION_TYPES = Object.freeze({
  CREDIT_FOOD_SALE: 'CREDIT_FOOD_SALE',
  CREDIT_DELIVERY_FEE: 'CREDIT_DELIVERY_FEE',
  DEBIT_PLATFORM_COMMISSION: 'DEBIT_PLATFORM_COMMISSION',
  DEBIT_COD_LIABILITY: 'DEBIT_COD_LIABILITY',
  CREDIT_COD_REMITTANCE: 'CREDIT_COD_REMITTANCE',
  DEBIT_ADMIN_PAYOUT: 'DEBIT_ADMIN_PAYOUT',
});

// notification priorities
export const NOTIFICATION_PRIORITIES = Object.freeze({
  ALARM: 'ALARM',
  SILENT: 'SILENT',
});

// notification event types
export const NOTIFICATION_TYPES = Object.freeze({
  ORDER_NEW: 'ORDER_NEW',
  ORDER_AVAILABLE: 'ORDER_AVAILABLE',
  RIDER_ASSIGNED: 'RIDER_ASSIGNED',
  ORDER_PREPARING: 'ORDER_PREPARING',
  FOOD_READY: 'FOOD_READY',
  ORDER_PICKED_UP: 'ORDER_PICKED_UP',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
});

