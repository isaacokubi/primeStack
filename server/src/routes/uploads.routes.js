import { Router } from 'express';
import multer from 'multer';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    callback(null, allowed.includes(file.mimetype));
  },
});

const uploadBuffer = (buffer, options) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
    if (error) reject(error);
    else resolve(result);
  });
  stream.end(buffer);
});

router.post('/image', requireAuth, requireRole('Admin', 'Editor'), upload.single('image'), async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({ success: false, message: 'Image storage is not configured. Add the Cloudinary environment variables to the API.' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'Please select an image.' });

    const result = await uploadBuffer(req.file.buffer, {
      folder: 'primestack/products',
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
      use_filename: true,
      unique_filename: true,
    });

    return res.status(201).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to upload image.' });
  }
});

export default router;
