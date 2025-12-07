/**
 * Family Tree Routes
 * CRUD operations for family tree members with tier-based access control
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { requireMemorialOwner } from '../middleware/authorization';
import { apiRateLimiter } from '../middleware/security';
import { z } from 'zod';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createFamilyMemberSchema = z.object({
  memorialId: z.string().uuid(),
  relatedToId: z.string().uuid().optional().nullable(),
  relationship: z.enum([
    'parent',
    'child',
    'spouse',
    'sibling',
    'grandparent',
    'grandchild',
    'aunt_uncle',
    'niece_nephew',
    'cousin',
    'other',
  ]),
  name: z.string().min(1).max(255),
  birthDate: z.string().datetime().optional().nullable(),
  deathDate: z.string().datetime().optional().nullable(),
  isLiving: z.boolean().default(false),
  photoUrl: z.string().url().optional().nullable(),
  linkedMemorialId: z.string().uuid().optional().nullable(),
  generation: z.number().int().default(0),
  notes: z.string().max(5000).optional().nullable(),
});

const updateFamilyMemberSchema = createFamilyMemberSchema.partial().omit({ memorialId: true });

// ============================================
// MIDDLEWARE - Check family tree tier access
// ============================================

const checkFamilyTreeAccess = async (req: Request, res: Response, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // FREE tier cannot access family tree
    if (user.subscriptionTier === 'FREE') {
      return res.status(403).json({
        error: 'Family tree requires Forever or Healing & Heritage plan',
        upgrade: true,
        requiredTier: 'FOREVER',
      });
    }

    next();
  } catch (error) {
    console.error('[FAMILY-TREE] Tier check error:', error);
    return res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

// ============================================
// MIDDLEWARE - Check generation limit
// ============================================

const checkGenerationLimit = async (req: Request, res: Response, next: any) => {
  try {
    const { memorialId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // FOREVER tier: max 3 generations
    // HEALING tier: unlimited
    if (user.subscriptionTier === 'FOREVER') {
      const members = await prisma.familyMember.findMany({
        where: { memorialId },
        select: { generation: true },
      });

      const minGen = Math.min(...members.map(m => m.generation), 0);
      const maxGen = Math.max(...members.map(m => m.generation), 0);
      const generationSpan = maxGen - minGen + 1;

      if (generationSpan >= 3) {
        return res.status(403).json({
          error: 'Forever plan limited to 3 generations. Upgrade to Healing & Heritage for unlimited.',
          upgrade: true,
          requiredTier: 'HEALING',
          currentLimit: 3,
        });
      }
    }

    next();
  } catch (error) {
    console.error('[FAMILY-TREE] Generation limit check error:', error);
    return res.status(500).json({ error: 'Failed to verify generation limit' });
  }
};

// ============================================
// GET /api/family-tree/:memorialId
// Get all family members for a memorial
// ============================================

router.get('/:memorialId', requireAuth, checkFamilyTreeAccess, apiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { memorialId } = req.params;

    // Verify memorial exists and user has access
    const memorial = await prisma.memorial.findFirst({
      where: {
        id: memorialId,
        OR: [
          { ownerId: req.user!.id }, // Owner
          { privacy: 'public' },      // Public memorial
          { privacy: 'link' },        // Link-accessible
        ],
      },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found or access denied' });
    }

    // Get family members
    const members = await prisma.familyMember.findMany({
      where: { memorialId },
      include: {
        linkedMemorial: {
          select: {
            id: true,
            deceasedName: true,
            portraitUrl: true,
          },
        },
      },
      orderBy: [
        { generation: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return res.status(200).json(members);
  } catch (error) {
    console.error('[FAMILY-TREE] Get members error:', error);
    return res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

// ============================================
// POST /api/family-tree
// Create a new family member
// ============================================

router.post(
  '/',
  requireAuth,
  checkFamilyTreeAccess,
  checkGenerationLimit,
  apiRateLimiter,
  async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = createFamilyMemberSchema.parse(req.body);

      // Verify user owns the memorial
      const memorial = await prisma.memorial.findFirst({
        where: {
          id: validatedData.memorialId,
          ownerId: req.user!.id,
        },
      });

      if (!memorial) {
        return res.status(404).json({ error: 'Memorial not found or access denied' });
      }

      // Create family member
      const member = await prisma.familyMember.create({
        data: {
          memorialId: validatedData.memorialId,
          relatedToId: validatedData.relatedToId || null,
          relationship: validatedData.relationship,
          name: validatedData.name,
          birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
          deathDate: validatedData.deathDate ? new Date(validatedData.deathDate) : null,
          isLiving: validatedData.isLiving,
          photoUrl: validatedData.photoUrl || null,
          linkedMemorialId: validatedData.linkedMemorialId || null,
          generation: validatedData.generation,
          notes: validatedData.notes || null,
        },
        include: {
          linkedMemorial: {
            select: {
              id: true,
              deceasedName: true,
              portraitUrl: true,
            },
          },
        },
      });

      return res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }

      console.error('[FAMILY-TREE] Create member error:', error);
      return res.status(500).json({ error: 'Failed to create family member' });
    }
  }
);

// ============================================
// PUT /api/family-tree/:memberId
// Update a family member
// ============================================

router.put('/:memberId', requireAuth, checkFamilyTreeAccess, apiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;

    // Validate request body
    const validatedData = updateFamilyMemberSchema.parse(req.body);

    // Verify user owns the memorial this member belongs to
    const existingMember = await prisma.familyMember.findUnique({
      where: { id: memberId },
      include: {
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    if (existingMember.memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update family member
    const updatedMember = await prisma.familyMember.update({
      where: { id: memberId },
      data: {
        ...(validatedData.relatedToId !== undefined && { relatedToId: validatedData.relatedToId }),
        ...(validatedData.relationship && { relationship: validatedData.relationship }),
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.birthDate !== undefined && {
          birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
        }),
        ...(validatedData.deathDate !== undefined && {
          deathDate: validatedData.deathDate ? new Date(validatedData.deathDate) : null,
        }),
        ...(validatedData.isLiving !== undefined && { isLiving: validatedData.isLiving }),
        ...(validatedData.photoUrl !== undefined && { photoUrl: validatedData.photoUrl }),
        ...(validatedData.linkedMemorialId !== undefined && { linkedMemorialId: validatedData.linkedMemorialId }),
        ...(validatedData.generation !== undefined && { generation: validatedData.generation }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
      include: {
        linkedMemorial: {
          select: {
            id: true,
            deceasedName: true,
            portraitUrl: true,
          },
        },
      },
    });

    return res.status(200).json(updatedMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    console.error('[FAMILY-TREE] Update member error:', error);
    return res.status(500).json({ error: 'Failed to update family member' });
  }
});

// ============================================
// DELETE /api/family-tree/:memberId
// Delete a family member
// ============================================

router.delete('/:memberId', requireAuth, checkFamilyTreeAccess, apiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;

    // Verify user owns the memorial this member belongs to
    const existingMember = await prisma.familyMember.findUnique({
      where: { id: memberId },
      include: {
        memorial: {
          select: { ownerId: true },
        },
        children: {
          select: { id: true },
        },
      },
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    if (existingMember.memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if member has children (optional: prevent deletion if they do)
    if (existingMember.children.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete family member with children. Remove children first or reassign them.',
        hasChildren: true,
        childrenCount: existingMember.children.length,
      });
    }

    // Delete family member
    await prisma.familyMember.delete({
      where: { id: memberId },
    });

    return res.status(200).json({ message: 'Family member deleted successfully' });
  } catch (error) {
    console.error('[FAMILY-TREE] Delete member error:', error);
    return res.status(500).json({ error: 'Failed to delete family member' });
  }
});

export default router;
