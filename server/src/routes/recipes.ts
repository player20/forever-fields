/**
 * Recipes Routes
 * CRUD operations for memorial recipes
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/security';
import { validate } from '../middleware/validate';
import { createRecipeSchema, updateRecipeSchema } from '../validators/schemas';

const router = Router();

/**
 * GET /api/recipes/:memorialId
 * Get all recipes for a memorial
 */
router.get('/:memorialId', optionalAuth, apiRateLimiter, async (req, res) => {
  try {
    const { memorialId } = req.params;

    // Verify memorial exists and user has access
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { privacy: true, ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Check privacy permissions
    if (memorial.privacy === 'private' && (!req.user || memorial.ownerId !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const recipes = await prisma.recipe.findMany({
      where: { memorialId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ recipes });
  } catch (error) {
    console.error('Get recipes error:', error);
    return res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

/**
 * POST /api/recipes/:memorialId
 * Create a new recipe (owner only)
 */
router.post('/:memorialId', requireAuth, apiRateLimiter, validate(createRecipeSchema), async (req, res) => {
  try {
    const { memorialId } = req.params;
    const { name, description, icon, ingredients, instructions } = req.body;

    // Verify user owns the memorial
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    if (memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can add recipes' });
    }

    const recipe = await prisma.recipe.create({
      data: {
        memorialId,
        name,
        description: description || null,
        icon: icon || null,
        ingredients: ingredients || null,
        instructions: instructions || null,
      },
    });

    return res.status(201).json({ recipe });
  } catch (error) {
    console.error('Create recipe error:', error);
    return res.status(500).json({ error: 'Failed to create recipe' });
  }
});

/**
 * PUT /api/recipes/:id
 * Update a recipe (owner only)
 */
router.put('/:id', requireAuth, apiRateLimiter, validate(updateRecipeSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, ingredients, instructions } = req.body;

    // Get recipe and verify ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: { memorial: { select: { ownerId: true } } },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (recipe.memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can update recipes' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (instructions !== undefined) updateData.instructions = instructions;

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ recipe: updatedRecipe });
  } catch (error) {
    console.error('Update recipe error:', error);
    return res.status(500).json({ error: 'Failed to update recipe' });
  }
});

/**
 * DELETE /api/recipes/:id
 * Delete a recipe (owner only)
 */
router.delete('/:id', requireAuth, apiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    // Get recipe and verify ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: { memorial: { select: { ownerId: true } } },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (recipe.memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can delete recipes' });
    }

    await prisma.recipe.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

export default router;
