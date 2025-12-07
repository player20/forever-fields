/**
 * Affiliate Routes Tests
 * Tests for flower delivery affiliate link generation
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Affiliate Routes', () => {
  const mockMemorial = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    deceasedName: 'John Doe',
    isPet: false,
    restingType: 'cemetery',
    restingLocation: {
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/affiliate/flowers', () => {
    it('should generate affiliate link with cemetery address', async () => {
      // Mock Prisma findUnique
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(mockMemorial as any);

      const res = await request(app)
        .get('/api/affiliate/flowers')
        .query({ memorialId: mockMemorial.id })
        .expect(200);

      expect(res.body).toHaveProperty('url');
      expect(res.body.url).toContain('bloomnation.com');
      expect(res.body.url).toContain('memorial_id=' + mockMemorial.id);
      expect(res.body.url).toContain('recipient_name=John%20Doe');
      expect(res.body.url).toContain('delivery_address=123%20Main%20St');
      expect(res.body.url).toContain('delivery_city=Springfield');
      expect(res.body.url).toContain('delivery_state=IL');
      expect(res.body.url).toContain('delivery_zip=62701');
      expect(res.body.hasAddress).toBe(true);
    });

    it('should generate affiliate link for pet memorial', async () => {
      const petMemorial = { ...mockMemorial, isPet: true };
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(petMemorial as any);

      const res = await request(app)
        .get('/api/affiliate/flowers')
        .query({ memorialId: mockMemorial.id })
        .expect(200);

      expect(res.body.url).toContain('pet_memorial=true');
      expect(res.body.isPet).toBe(true);
    });

    it('should sanitize dangerous characters in name', async () => {
      const xssMemorial = {
        ...mockMemorial,
        deceasedName: 'John<script>alert("xss")</script>Doe',
      };
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(xssMemorial as any);

      const res = await request(app)
        .get('/api/affiliate/flowers')
        .query({ memorialId: mockMemorial.id })
        .expect(200);

      expect(res.body.url).not.toContain('<script>');
      expect(res.body.url).not.toContain('alert');
      expect(res.body.url).toContain('recipient_name=JohnscriptalertxssscriptDoe');
    });

    it('should handle memorial without cemetery address', async () => {
      const noAddressMemorial = {
        ...mockMemorial,
        restingType: 'cremated',
        restingLocation: null,
      };
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(noAddressMemorial as any);

      const res = await request(app)
        .get('/api/affiliate/flowers')
        .query({ memorialId: mockMemorial.id })
        .expect(200);

      expect(res.body.url).not.toContain('delivery_address');
      expect(res.body.hasAddress).toBe(false);
    });

    it('should reject invalid memorial ID format', async () => {
      const res = await request(app)
        .get('/api/affiliate/flowers')
        .query({ memorialId: 'invalid-uuid' })
        .expect(400);

      expect(res.body.error).toContain('Invalid memorial ID');
    });

    it('should return 404 for non-existent memorial', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/affiliate/flowers')
        .query({ memorialId: mockMemorial.id })
        .expect(404);

      expect(res.body.error).toBe('Memorial not found');
    });

    it('should truncate very long names', async () => {
      const longNameMemorial = {
        ...mockMemorial,
        deceasedName: 'A'.repeat(100),
      };
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(longNameMemorial as any);

      const res = await request(app)
        .get('/api/affiliate/flowers')
        .query({ memorialId: mockMemorial.id })
        .expect(200);

      const urlParams = new URLSearchParams(res.body.url.split('?')[1]);
      const recipientName = urlParams.get('recipient_name');
      expect(recipientName?.length).toBeLessThanOrEqual(50);
    });

    it('should use affiliate ID from environment variable', async () => {
      const originalEnv = process.env.BLOOMNATION_AFFILIATE_ID;
      process.env.BLOOMNATION_AFFILIATE_ID = 'test-affiliate-123';

      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(mockMemorial as any);

      const res = await request(app)
        .get('/api/affiliate/flowers')
        .query({ memorialId: mockMemorial.id })
        .expect(200);

      expect(res.body.url).toContain('ref=test-affiliate-123');

      process.env.BLOOMNATION_AFFILIATE_ID = originalEnv;
    });
  });

  describe('GET /api/affiliate/flowers/redirect', () => {
    it('should redirect to BloomNation with affiliate link', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(mockMemorial as any);

      const res = await request(app)
        .get('/api/affiliate/flowers/redirect')
        .query({ memorialId: mockMemorial.id })
        .expect(302);

      expect(res.headers.location).toContain('bloomnation.com');
      expect(res.headers.location).toContain(mockMemorial.id);
    });

    it('should return 404 if memorial not found', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/affiliate/flowers/redirect')
        .query({ memorialId: mockMemorial.id })
        .expect(404);

      expect(res.body.error).toBe('Memorial not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to affiliate endpoints', async () => {
      vi.spyOn(prisma.memorial, 'findUnique').mockResolvedValue(mockMemorial as any);

      // Make multiple requests quickly
      const requests = Array(101).fill(null).map(() =>
        request(app)
          .get('/api/affiliate/flowers')
          .query({ memorialId: mockMemorial.id })
      );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
