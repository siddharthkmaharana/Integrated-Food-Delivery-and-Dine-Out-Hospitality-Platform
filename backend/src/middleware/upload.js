import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import s3Client, { S3_BUCKET } from '../config/s3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Allowed MIME types ─────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WEBP images are allowed'), false);
  }
};

// ─── Storage Strategy ────────────────────────────────────────────────────────
const useS3 = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

let storage;

if (useS3) {
  // ── Production: stream directly to S3 ─────────────────────────────────────
  storage = multerS3({
    s3: s3Client,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const folder = req.uploadFolder || 'uploads';
      const uniqueName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
} else {
  // ── Development: save to local /uploads directory ─────────────────────────
  const uploadDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
}

// ─── Multer instance ─────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

/**
 * Helper to extract the public URL from an uploaded file object.
 * Works for both S3 (multer-s3 sets file.location) and local disk.
 *
 * @param {Express.Multer.File} file
 * @param {import('express').Request} req
 * @returns {string} Public URL or local path
 */
export const getFileUrl = (file, req) => {
  if (useS3) {
    return file.location; // S3 public URL
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${file.filename}`;
};

export { useS3 };
export default upload;
