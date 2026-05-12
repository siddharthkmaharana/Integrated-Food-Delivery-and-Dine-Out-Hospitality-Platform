import { S3Client } from '@aws-sdk/client-s3';

/**
 * S3 client instance — used for media uploads (review images, restaurant photos).
 * Configured via environment variables. If AWS credentials are absent, the app
 * gracefully falls back to local disk storage via multer.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'dineout-media';

export default s3Client;
