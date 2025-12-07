/**
 * Admin Dashboard Routes
 * Admin-only endpoints for dashboard, analytics, and moderation
 * All routes require admin authentication
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { requireAdmin, logAdminAction, auditAdminAction } from '../middleware/admin';
import { strictRateLimiter } from '../middleware/security';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth);
router.use(requireAdmin);
router.use(strictRateLimiter); // 10 requests per minute for admin routes

// ============================================
// GET /api/admin/signups
// Get recent signups with filtering and pagination
// ============================================

router.get('/signups', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    // Get signups with pagination
    const signups = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        signupIp: true,
        subscriptionTier: true,
        termsAcceptedAt: true,
        termsVersion: true,
        createdAt: true,
        _count: {
          select: {
            memorials: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return res.status(200).json({
      signups: signups.map(s => ({
        id: s.id,
        email: s.email,
        name: s.name || 'N/A',
        signupIp: s.signupIp || 'N/A',
        tier: s.subscriptionTier,
        termsAccepted: s.termsAcceptedAt ? true : false,
        termsVersion: s.termsVersion || 'N/A',
        memorialCount: s._count.memorials,
        createdAt: s.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + signups.length < totalCount,
      },
    });
  } catch (error) {
    console.error('[ADMIN] Get signups error:', error);
    return res.status(500).json({ error: 'Failed to fetch signups' });
  }
});

// ============================================
// GET /api/admin/memorials
// Get all memorials with stats and filtering
// ============================================

router.get('/memorials', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const privacy = req.query.privacy as string;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.deceasedName = { contains: search, mode: 'insensitive' };
    }
    if (privacy && ['public', 'private', 'link'].includes(privacy)) {
      where.privacy = privacy;
    }

    const totalCount = await prisma.memorial.count({ where });

    const memorials = await prisma.memorial.findMany({
      where,
      select: {
        id: true,
        deceasedName: true,
        birthDate: true,
        deathDate: true,
        privacy: true,
        isPet: true,
        portraitUrl: true,
        createdAt: true,
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            photos: true,
            candles: true,
            memories: true,
            guestbookEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return res.status(200).json({
      memorials: memorials.map(m => ({
        id: m.id,
        deceasedName: m.deceasedName,
        birthDate: m.birthDate?.toISOString().split('T')[0],
        deathDate: m.deathDate?.toISOString().split('T')[0],
        privacy: m.privacy,
        isPet: m.isPet,
        portraitUrl: m.portraitUrl || null,
        owner: m.owner.email,
        ownerName: m.owner.name || 'N/A',
        photoCount: m._count.photos,
        candleCount: m._count.candles,
        memoryCount: m._count.memories,
        guestbookCount: m._count.guestbookEntries,
        createdAt: m.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + memorials.length < totalCount,
      },
    });
  } catch (error) {
    console.error('[ADMIN] Get memorials error:', error);
    return res.status(500).json({ error: 'Failed to fetch memorials' });
  }
});

// ============================================
// GET /api/admin/duplicates
// Find potential duplicate memorials
// ============================================

router.get('/duplicates', async (req: Request, res: Response) => {
  try {
    // Find memorials with same name and birth/death dates
    const duplicates = await prisma.$queryRaw<any[]>`
      SELECT
        m1.id as id1,
        m1.deceased_name as name1,
        m1.birth_date as birth1,
        m1.death_date as death1,
        m1.owner_id as owner1,
        m2.id as id2,
        m2.deceased_name as name2,
        m2.birth_date as birth2,
        m2.death_date as death2,
        m2.owner_id as owner2
      FROM memorials m1
      JOIN memorials m2 ON
        m1.deceased_name_lower = m2.deceased_name_lower
        AND m1.id < m2.id
        AND (
          m1.birth_date = m2.birth_date
          OR m1.death_date = m2.death_date
        )
      ORDER BY m1.deceased_name
    `;

    return res.status(200).json({
      duplicates: duplicates.map(d => ({
        memorial1: {
          id: d.id1,
          name: d.name1,
          birthDate: d.birth1,
          deathDate: d.death1,
          ownerId: d.owner1,
        },
        memorial2: {
          id: d.id2,
          name: d.name2,
          birthDate: d.birth2,
          deathDate: d.death2,
          ownerId: d.owner2,
        },
        matchType: d.birth1 === d.birth2 ? 'birth_date' : 'death_date',
      })),
    });
  } catch (error) {
    console.error('[ADMIN] Get duplicates error:', error);
    return res.status(500).json({ error: 'Failed to fetch duplicates' });
  }
});

// ============================================
// POST /api/admin/merge-memorials
// Merge two memorials (soft merge - keeps both but links them)
// ============================================

const mergeMemorialsSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
});

router.post('/merge-memorials', auditAdminAction('merge_memorials'), async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId } = mergeMemorialsSchema.parse(req.body);

    // Verify both memorials exist
    const [source, target] = await Promise.all([
      prisma.memorial.findUnique({ where: { id: sourceId } }),
      prisma.memorial.findUnique({ where: { id: targetId } }),
    ]);

    if (!source || !target) {
      return res.status(404).json({ error: 'One or both memorials not found' });
    }

    // Update source memorial to be private and add note about merge
    await prisma.memorial.update({
      where: { id: sourceId },
      data: {
        privacy: 'private',
        shortBio: source.shortBio
          ? `${source.shortBio}\n\n[Admin Note: This memorial has been gently merged with another. Content preserved for reference.]`
          : '[Admin Note: This memorial has been gently merged with another. Content preserved for reference.]',
      },
    });

    // Log the merge action with details
    await logAdminAction(req.user!.id, 'merge_memorials', {
      targetType: 'memorial',
      targetId: targetId,
      metadata: {
        sourceId,
        sourceName: source.deceasedName,
        targetName: target.deceasedName,
      },
      ipAddress: (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', ''),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return res.status(200).json({
      message: 'Memorials merged successfully',
      source: { id: sourceId, name: source.deceasedName },
      target: { id: targetId, name: target.deceasedName },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }

    console.error('[ADMIN] Merge memorials error:', error);
    return res.status(500).json({ error: 'Failed to merge memorials' });
  }
});

// ============================================
// GET /api/admin/stats
// Get dashboard statistics
// ============================================

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalMemorials,
      totalPhotos,
      totalCandles,
      signupsToday,
      signupsThisWeek,
      signupsThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.memorial.count(),
      prisma.photo.count(),
      prisma.candle.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get tier breakdown
    const tierBreakdown = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: true,
    });

    return res.status(200).json({
      totals: {
        users: totalUsers,
        memorials: totalMemorials,
        photos: totalPhotos,
        candles: totalCandles,
      },
      signups: {
        today: signupsToday,
        thisWeek: signupsThisWeek,
        thisMonth: signupsThisMonth,
      },
      tiers: tierBreakdown.reduce((acc, t) => {
        acc[t.subscriptionTier] = t._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('[ADMIN] Get stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================
// GET /api/admin/audit-log
// Get admin audit log with pagination
// ============================================

router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const totalCount = await prisma.adminAuditLog.count();

    const logs = await prisma.adminAuditLog.findMany({
      include: {
        admin: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return res.status(200).json({
      logs: logs.map(log => ({
        id: log.id,
        admin: log.admin.email,
        adminName: log.admin.name || 'N/A',
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + logs.length < totalCount,
      },
    });
  } catch (error) {
    console.error('[ADMIN] Get audit log error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// ============================================
// GET /api/admin/export/signups
// Export signups as CSV
// ============================================

router.get('/export/signups', auditAdminAction('export_signups'), async (req: Request, res: Response) => {
  try {
    const signups = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        signupIp: true,
        subscriptionTier: true,
        termsAcceptedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const headers = ['Email', 'Name', 'IP Address', 'Tier', 'Terms Accepted', 'Signup Date'];
    const rows = signups.map(s => [
      s.email,
      s.name || 'N/A',
      s.signupIp || 'N/A',
      s.subscriptionTier,
      s.termsAcceptedAt ? s.termsAcceptedAt.toISOString() : 'No',
      s.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="signups-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error('[ADMIN] Export signups error:', error);
    return res.status(500).json({ error: 'Failed to export signups' });
  }
});

export default router;
