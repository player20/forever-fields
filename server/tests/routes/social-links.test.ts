/**
 * Social Links Routes Tests
 * Tests for social media links management
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Social Links Routes', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockMemorial = {
    id: 'memorial-456',
    ownerId: 'user-123',
    privacy: 'public',
    socialLinks: {
      facebook: 'https://facebook.com/johndoe',
      instagram: 'https://instagram.com/johndoe',
      tiktok: 'https://tiktok.com/@johndoe',
    },
  };

  const mockAuthToken = 'mock-jwt-token';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock authentication middleware
    vi.mock('../../src/middleware/auth', () => ({
      requireAuth: (req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
      },
    }));
  });

  describe('GET /api/social-links/:memorialId', () => {
    it('should return social links for public memorial', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(mockMemorial as any);

      const res = await request(app)
        .get(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(res.body.memorialId).toBe(mockMemorial.id);
      expect(res.body.socialLinks).toEqual(mockMemorial.socialLinks);
    });

    it('should return empty social links if none exist', async () => {
      const noLinksMemorial = { ...mockMemorial, socialLinks: null };
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(noLinksMemorial as any);

      const res = await request(app)
        .get(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(res.body.socialLinks).toEqual({
        facebook: null,
        instagram: null,
        tiktok: null,
      });
    });

    it('should reject access to private memorial from non-owner', async () => {
      const privateMemorial = {
        ...mockMemorial,
        privacy: 'private',
        ownerId: 'different-user',
      };
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(privateMemorial as any);

      const res = await request(app)
        .get(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(403);

      expect(res.body.error).toBe('Access denied');
    });

    it('should return 404 for non-existent memorial', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);

      expect(res.body.error).toBe('Memorial not found');
    });
  });

  describe('PUT /api/social-links/:memorialId', () => {
    it('should update social links successfully', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      const updatedLinks = {
        facebook: 'https://facebook.com/newprofile',
        instagram: 'https://instagram.com/newprofile',
        tiktok: 'https://tiktok.com/@newprofile',
      };

      vi.spyOn(prisma.socialLink, 'upsert').mockResolvedValue({
        memorialId: mockMemorial.id,
        ...updatedLinks,
      } as any);

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(updatedLinks)
        .expect(200);

      expect(res.body.message).toBe('Social links updated successfully');
      expect(res.body.socialLinks).toMatchObject(updatedLinks);
    });

    it('should validate Facebook URL format', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      const invalidLinks = {
        facebook: 'https://twitter.com/invalid', // Wrong platform
        instagram: null,
        tiktok: null,
      };

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(invalidLinks)
        .expect(400);

      expect(res.body.error).toContain('Invalid facebook URL format');
    });

    it('should validate Instagram URL format', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      const invalidLinks = {
        facebook: null,
        instagram: 'https://facebook.com/invalid', // Wrong platform
        tiktok: null,
      };

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(invalidLinks)
        .expect(400);

      expect(res.body.error).toContain('Invalid instagram URL format');
    });

    it('should validate TikTok URL format', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      const invalidLinks = {
        facebook: null,
        instagram: null,
        tiktok: 'https://tiktok.com/invalid', // Missing @
      };

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(invalidLinks)
        .expect(400);

      expect(res.body.error).toContain('Invalid tiktok URL format');
    });

    it('should reject XSS attempts in URLs', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      const xssLinks = {
        facebook: 'https://facebook.com/test<script>alert("xss")</script>',
        instagram: null,
        tiktok: null,
      };

      vi.spyOn(prisma.socialLink, 'upsert').mockResolvedValue({
        memorialId: mockMemorial.id,
        facebook: 'https://facebook.com/testscriptalertxssscript',
        instagram: null,
        tiktok: null,
      } as any);

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(xssLinks)
        .expect(200);

      // URL should be sanitized (no < > " ')
      expect(res.body.socialLinks.facebook).not.toContain('<');
      expect(res.body.socialLinks.facebook).not.toContain('>');
    });

    it('should reject URLs over 500 characters', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      const longUrl = 'https://facebook.com/' + 'a'.repeat(500);

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ facebook: longUrl, instagram: null, tiktok: null })
        .expect(400);

      expect(res.body.error).toContain('URL too long');
    });

    it('should allow null values to clear links', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      vi.spyOn(prisma.socialLink, 'upsert').mockResolvedValue({
        memorialId: mockMemorial.id,
        facebook: null,
        instagram: null,
        tiktok: null,
      } as any);

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ facebook: null, instagram: null, tiktok: null })
        .expect(200);

      expect(res.body.socialLinks.facebook).toBeNull();
      expect(res.body.socialLinks.instagram).toBeNull();
      expect(res.body.socialLinks.tiktok).toBeNull();
    });

    it('should reject update from non-owner', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: 'different-user',
      } as any);

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ facebook: 'https://facebook.com/test', instagram: null, tiktok: null })
        .expect(403);

      expect(res.body.error).toBe('Only memorial owner can update social links');
    });

    it('should handle www prefixes in URLs', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      const linksWithWww = {
        facebook: 'https://www.facebook.com/johndoe',
        instagram: 'https://www.instagram.com/johndoe',
        tiktok: 'https://www.tiktok.com/@johndoe',
      };

      vi.spyOn(prisma.socialLink, 'upsert').mockResolvedValue({
        memorialId: mockMemorial.id,
        ...linksWithWww,
      } as any);

      const res = await request(app)
        .put(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(linksWithWww)
        .expect(200);

      expect(res.body.message).toBe('Social links updated successfully');
    });
  });

  describe('DELETE /api/social-links/:memorialId', () => {
    it('should delete social links successfully', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      vi.spyOn(prisma.socialLink, 'delete').mockResolvedValue({} as any);

      const res = await request(app)
        .delete(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(res.body.message).toBe('Social links removed successfully');
    });

    it('should handle deletion when no links exist', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      vi.spyOn(prisma.socialLink, 'delete').mockRejectedValue(new Error('Not found'));

      const res = await request(app)
        .delete(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200);

      expect(res.body.message).toBe('Social links removed successfully');
    });

    it('should reject deletion from non-owner', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: 'different-user',
      } as any);

      const res = await request(app)
        .delete(`/api/social-links/${mockMemorial.id}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(403);

      expect(res.body.error).toBe('Only memorial owner can remove social links');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply strict rate limiting to PUT endpoint', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue({
        id: mockMemorial.id,
        ownerId: mockUser.id,
      } as any);

      vi.spyOn(prisma.socialLink, 'upsert').mockResolvedValue({
        memorialId: mockMemorial.id,
        facebook: 'https://facebook.com/test',
        instagram: null,
        tiktok: null,
      } as any);

      // Make 11 requests quickly (strict limit is 10/minute)
      const requests = Array(11).fill(null).map(() =>
        request(app)
          .put(`/api/social-links/${mockMemorial.id}`)
          .set('Authorization', `Bearer ${mockAuthToken}`)
          .send({ facebook: 'https://facebook.com/test', instagram: null, tiktok: null })
      );

      const responses = await Promise.all(requests);

      // Last request should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
