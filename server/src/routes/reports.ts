/**
 * Reports Routes
 * Content flagging and moderation
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { createReportSchema, resolveReportSchema } from '../validators/schemas';
import { isMemorialOwner } from '../utils/permissions';

const router = Router();

/**
 * POST /api/reports
 * Submit a content report (flagging inappropriate content)
 */
router.post(
  '/',
  optionalAuth,
  apiRateLimiter,
  validate(createReportSchema),
  async (req, res) => {
    try {
      const { memorialId, contentType, contentId, reason, reporterName, reporterEmail } = req.body;

      // Verify memorial exists
      const memorial = await prisma.memorial.findUnique({
        where: { id: memorialId },
        select: { id: true },
      });

      if (!memorial) {
        return res.status(404).json({ error: 'Memorial not found' });
      }

      // Create report
      const report = await prisma.report.create({
        data: {
          memorialId,
          contentType,
          contentId,
          reason,
          reporterName: reporterName || null,
          reporterEmail: reporterEmail || null,
          status: 'pending',
        },
      });

      return res.status(201).json({
        report,
        message: 'Thank you for your report. The memorial owner will be notified.',
      });
    } catch (error) {
      console.error('Create report error:', error);
      return res.status(500).json({ error: 'Failed to submit report' });
    }
  }
);

/**
 * GET /api/reports/:memorialId
 * Get all reports for a memorial (owner only)
 */
router.get('/:memorialId', requireAuth, async (req, res) => {
  try {
    const { memorialId } = req.params;

    // Check if user is owner
    const isOwner = await isMemorialOwner(memorialId, req.user!.id);

    if (!isOwner) {
      return res.status(403).json({ error: 'Only memorial owner can view reports' });
    }

    // Get all reports for memorial
    const reports = await prisma.report.findMany({
      where: { memorialId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * POST /api/reports/:id/resolve
 * Resolve a report (owner only)
 */
router.post('/:id/resolve', requireAuth, validate(resolveReportSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'resolved' or 'dismissed'

    // Get report
    const report = await prisma.report.findUnique({
      where: { id },
      include: { memorial: true },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user is owner
    const isOwner = await isMemorialOwner(report.memorialId, req.user!.id);

    if (!isOwner) {
      return res.status(403).json({ error: 'Only memorial owner can resolve reports' });
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: action,
        resolvedAt: new Date(),
      },
    });

    return res.status(200).json({
      report: updatedReport,
      message: `Report ${action} successfully`,
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    return res.status(500).json({ error: 'Failed to resolve report' });
  }
});

export default router;
