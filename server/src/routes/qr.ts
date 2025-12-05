/**
 * QR Code Routes
 * Generate and manage QR codes for memorials with Cloudinary design overlays
 */

import { Router } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { requireMemorialOwner } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { createQRCodeSchema } from '../validators/schemas';
import { cloudinary } from '../config/cloudinary';

const router = Router();

// QR Code design configurations with Cloudinary overlays
const QR_DESIGNS = {
  marble: {
    background: '#f5f5f5',
    foreground: '#2c3338',
    overlay: 'forever-fields/designs/marble-texture',
    border: '#c9a962', // gold
  },
  garden: {
    background: '#e8ede5',
    foreground: '#4a5a6b',
    overlay: 'forever-fields/designs/garden-pattern',
    border: '#8b9f82', // sage
  },
  gold: {
    background: '#f5f1e8',
    foreground: '#4a5568',
    overlay: 'forever-fields/designs/gold-filigree',
    border: '#c9a962', // gold
  },
  minimalist: {
    background: '#ffffff',
    foreground: '#2c3338',
    overlay: null, // no overlay
    border: '#8b9f82', // sage
  },
};

/**
 * POST /api/qr
 * Create or update QR code for a memorial
 */
router.post(
  '/',
  requireAuth,
  requireMemorialOwner,
  apiRateLimiter,
  validate(createQRCodeSchema),
  async (req, res) => {
    try {
      const { memorialId, design } = req.body;

      // Upsert QR code
      const qrCode = await prisma.qRCode.upsert({
        where: { memorialId },
        update: { design },
        create: {
          memorialId,
          design: design || 'minimalist',
        },
      });

      return res.status(200).json({ qrCode });
    } catch (error) {
      console.error('Create QR code error:', error);
      return res.status(500).json({ error: 'Failed to create QR code' });
    }
  }
);

/**
 * GET /api/qr/:memorialId
 * Generate QR code with design overlay
 */
router.get('/:memorialId', apiRateLimiter, async (req, res) => {
  try {
    const { memorialId } = req.params;
    const { design = 'minimalist', download = 'false' } = req.query;

    // Validate design
    const designKey = design as keyof typeof QR_DESIGNS;
    if (!QR_DESIGNS[designKey]) {
      return res.status(400).json({ error: 'Invalid design. Must be: marble, garden, gold, or minimalist' });
    }

    // Get memorial
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        deceasedName: true,
        privacy: true,
      },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Generate memorial URL for QR code
    const memorialUrl = `${process.env.FRONTEND_URL || 'https://foreverfields.com'}/memorial?id=${memorialId}`;

    // Get or create QR code record
    let qrCodeRecord = await prisma.qRCode.findUnique({
      where: { memorialId },
    });

    if (!qrCodeRecord) {
      qrCodeRecord = await prisma.qRCode.create({
        data: {
          memorialId,
          design: designKey,
        },
      });
    }

    // Generate base QR code as data URL
    const designConfig = QR_DESIGNS[designKey];
    const qrDataUrl = await QRCode.toDataURL(memorialUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: designConfig.foreground,
        light: designConfig.background,
      },
    });

    // Convert data URL to buffer
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');

    // Upload base QR to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `forever-fields/qr-codes/${memorialId}`,
          public_id: `qr-${designKey}-${Date.now()}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(qrBuffer);
    });

    let finalQrUrl = uploadResult.secure_url;

    // Apply design overlay if specified
    if (designConfig.overlay) {
      // Use Cloudinary transformations to apply overlay
      finalQrUrl = cloudinary.url(uploadResult.public_id, {
        transformation: [
          { width: 400, height: 400, crop: 'fill' },
          {
            overlay: designConfig.overlay,
            opacity: 15,
            width: 400,
            height: 400,
            crop: 'fill',
          },
          {
            border: `8px_solid_${designConfig.border.replace('#', 'rgb:')}`,
          },
          { quality: 'auto:best', fetch_format: 'auto' },
        ],
      });
    }

    // Update QR code record with design
    await prisma.qRCode.update({
      where: { memorialId },
      data: {
        design: designKey,
      },
    });

    // Return as download or JSON
    if (download === 'true') {
      return res.redirect(finalQrUrl);
    }

    return res.status(200).json({
      qrCode: {
        memorialId,
        design: designKey,
        url: finalQrUrl,
        memorialUrl,
      },
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

export default router;
