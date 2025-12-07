/**
 * Upload Routes
 * Cloudinary signed uploads with auto-optimization and AI moderation
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { requireMemorialEditor } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { uploadRateLimiter } from '../middleware/security';
import { canUploadPhoto, requireActiveSubscription } from '../middleware/subscription-guard';
import { uploadSignSchema } from '../validators/schemas';
import { cloudinary } from '../config/cloudinary';
import { checkMemorialAccess } from '../utils/permissions';

const router = Router();

/**
 * POST /api/uploads/sign
 * Generate signed Cloudinary upload URL with auto-optimization and AI moderation
 */
router.post(
  '/sign',
  requireAuth,
  requireActiveSubscription, // Check trial hasn't expired
  canUploadPhoto,            // Check photo limit for tier (only applies if memorialId provided)
  uploadRateLimiter,
  validate(uploadSignSchema),
  async (req, res) => {
    try {
      const { fileType, fileName, memorialId } = req.body;

      // Verify user has access to memorial if memorialId provided
      if (memorialId) {
        const memorial = await prisma.memorial.findUnique({
          where: { id: memorialId },
          select: { ownerId: true },
        });

        if (!memorial) {
          return res.status(404).json({ error: 'Memorial not found' });
        }

        // Check if user is owner (for now, can expand to editors later)
        if (memorial.ownerId !== req.user!.id) {
          return res.status(403).json({ error: 'You do not have permission to upload to this memorial' });
        }
      }

      // Determine folder and resource type
      let folder = 'forever-fields';
      let resourceType: 'image' | 'video' | 'raw' = 'image';

      if (fileType === 'image') {
        folder += '/images';
        resourceType = 'image';
      } else if (fileType === 'video') {
        folder += '/videos';
        resourceType = 'video';
      } else if (fileType === 'audio') {
        folder += '/audio';
        resourceType = 'raw';
      }

      if (memorialId) {
        folder += `/${memorialId}`;
      }

      // Generate timestamp
      const timestamp = Math.round(new Date().getTime() / 1000);

      // Create upload parameters with auto-optimization and AI moderation
      const uploadParams: any = {
        timestamp,
        folder,
        resource_type: resourceType,
        allowed_formats: fileType === 'image'
          ? 'jpg,png,gif,webp,heic,avif'
          : fileType === 'video'
          ? 'mp4,mov,avi,webm'
          : 'mp3,wav,m4a,ogg',
        max_file_size: fileType === 'image'
          ? 10485760 // 10MB for images
          : fileType === 'video'
          ? 104857600 // 100MB for videos
          : 20971520, // 20MB for audio
      };

      // Add image-specific optimizations
      if (fileType === 'image') {
        // Auto-optimization: WebP format, quality, compression
        uploadParams.format = 'webp';
        uploadParams.quality = 'auto:good';
        uploadParams.fetch_format = 'auto';

        // AI content moderation (explicit content detection)
        uploadParams.moderation = 'aws_rek:explicit';

        // Auto-tagging for better organization
        uploadParams.categorization = 'aws_rek_tagging';
        uploadParams.auto_tagging = 0.6; // 60% confidence threshold

        // Generate responsive breakpoints
        uploadParams.responsive_breakpoints = {
          create_derived: true,
          bytes_step: 20000,
          min_width: 200,
          max_width: 1600,
          max_images: 5,
        };
      }

      // Generate signature
      const signature = cloudinary.utils.api_sign_request(
        uploadParams,
        process.env.CLOUDINARY_API_SECRET!
      );

      return res.status(200).json({
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder,
        resourceType,
        uploadParams, // Include params for client-side upload
      });
    } catch (error) {
      console.error('Upload sign error:', error);
      return res.status(500).json({ error: 'Failed to generate upload signature' });
    }
  }
);

/**
 * POST /api/uploads/complete
 * Handle successful upload - create pending item for approval
 */
router.post(
  '/complete',
  requireAuth,
  uploadRateLimiter,
  async (req, res) => {
    try {
      const { memorialId, cloudinaryResult } = req.body;

      if (!memorialId || !cloudinaryResult) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify memorial access
      const memorial = await prisma.memorial.findUnique({
        where: { id: memorialId },
        select: { ownerId: true },
      });

      if (!memorial) {
        return res.status(404).json({ error: 'Memorial not found' });
      }

      if (memorial.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'You do not have permission to upload to this memorial' });
      }

      // Extract data from Cloudinary result
      const {
        public_id,
        secure_url,
        format,
        width,
        height,
        bytes,
        created_at,
        moderation,
        tags,
      } = cloudinaryResult;

      // Check moderation status
      const moderationStatus = moderation?.[0]?.status || 'approved';

      // Create pending item
      const pendingItem = await prisma.pendingItem.create({
        data: {
          memorialId,
          type: 'photo',
          status: moderationStatus === 'approved' ? 'pending' : 'rejected',
          dataJson: {
            publicId: public_id,
            url: secure_url,
            format,
            width,
            height,
            bytes,
            uploadedAt: created_at,
            moderation: moderationStatus,
            tags: tags || [],
            uploadedBy: req.user!.id,
          },
        },
      });

      return res.status(201).json({
        pendingItem,
        message: moderationStatus === 'approved'
          ? 'Photo uploaded successfully. Awaiting approval.'
          : 'Photo rejected by AI moderation.',
      });
    } catch (error) {
      console.error('Upload complete error:', error);
      return res.status(500).json({ error: 'Failed to process upload' });
    }
  }
);

/**
 * GET /api/uploads/memorial/:memorialId
 * Get all approved photos for a memorial
 */
router.get(
  '/memorial/:memorialId',
  optionalAuth,
  async (req, res) => {
    try {
      const { memorialId } = req.params;

      // Check access using permissions utility
      const access = await checkMemorialAccess(
        memorialId,
        req.user?.id || null,
        'viewer'
      );

      if (!access.allowed) {
        return res.status(403).json({ error: access.reason || 'Access denied' });
      }

      // Get approved photo pending items
      const approvedPhotos = await prisma.pendingItem.findMany({
        where: {
          memorialId,
          type: 'photo',
          status: 'approved',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Extract photo data
      const photos = approvedPhotos.map((item) => ({
        id: item.id,
        ...(typeof item.dataJson === 'object' && item.dataJson !== null ? item.dataJson : {}),
        approvedAt: item.createdAt,
      }));

      return res.status(200).json({ photos });
    } catch (error) {
      console.error('Get photos error:', error);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }
  }
);

export default router;
