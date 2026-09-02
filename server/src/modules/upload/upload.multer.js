// multer configuration for in-memory file uploads
import multer from 'multer';
import { ApiError } from '../../utils/apiError.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `unsupported file type: ${file.mimetype}. allowed types: jpeg, png, webp, gif`
      ),
      false
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});
