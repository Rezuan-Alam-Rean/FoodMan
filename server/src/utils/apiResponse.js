import { HTTP_STATUS } from '../constants/index.js';

export class ApiResponse {
  constructor(statusCode, data = null, message = 'Success', meta = null) {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
    if (meta !== null) {
      this.meta = meta;
    }
  }

  static success(res, { statusCode = HTTP_STATUS.OK, data = null, message = 'Success', meta = null } = {}) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message, meta));
  }

  static created(res, { data = null, message = 'Resource created successfully', meta = null } = {}) {
    return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, data, message, meta));
  }
}
