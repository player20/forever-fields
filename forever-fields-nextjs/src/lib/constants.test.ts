// ======================
// Constants Tests
// ======================

import { describe, it, expect } from "vitest";
import {
  FILE_LIMITS,
  API_CONFIG,
  VALIDATION,
  ERROR_CODES,
  HTTP_STATUS,
  TIER_HIERARCHY,
  tierMeetsRequirement,
} from "./constants";

describe("FILE_LIMITS", () => {
  it("has correct image max size (10MB)", () => {
    expect(FILE_LIMITS.IMAGE_MAX_SIZE).toBe(10 * 1024 * 1024);
  });

  it("has correct audio max size (50MB)", () => {
    expect(FILE_LIMITS.AUDIO_MAX_SIZE).toBe(50 * 1024 * 1024);
  });

  it("includes expected image types", () => {
    expect(FILE_LIMITS.ALLOWED_IMAGE_TYPES).toContain("image/jpeg");
    expect(FILE_LIMITS.ALLOWED_IMAGE_TYPES).toContain("image/png");
    expect(FILE_LIMITS.ALLOWED_IMAGE_TYPES).toContain("image/webp");
  });
});

describe("API_CONFIG", () => {
  it("has default timeout of 30 seconds", () => {
    expect(API_CONFIG.DEFAULT_TIMEOUT).toBe(30_000);
  });

  it("has AI timeout of 60 seconds", () => {
    expect(API_CONFIG.AI_TIMEOUT).toBe(60_000);
  });
});

describe("VALIDATION", () => {
  it("has password minimum length of 8", () => {
    expect(VALIDATION.PASSWORD_MIN_LENGTH).toBe(8);
  });

  it("has reasonable bio max length", () => {
    expect(VALIDATION.BIO_MAX_LENGTH).toBeGreaterThan(1000);
  });
});

describe("ERROR_CODES", () => {
  it("has all required error codes", () => {
    expect(ERROR_CODES.UNAUTHORIZED).toBeDefined();
    expect(ERROR_CODES.FORBIDDEN).toBeDefined();
    expect(ERROR_CODES.NOT_FOUND).toBeDefined();
    expect(ERROR_CODES.VALIDATION_ERROR).toBeDefined();
    expect(ERROR_CODES.RATE_LIMITED).toBeDefined();
    expect(ERROR_CODES.INTERNAL_ERROR).toBeDefined();
  });
});

describe("HTTP_STATUS", () => {
  it("has correct status codes", () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });
});

describe("TIER_HIERARCHY", () => {
  it("has 4 tiers in correct order", () => {
    expect(TIER_HIERARCHY).toHaveLength(4);
    expect(TIER_HIERARCHY[0]).toBe("free");
    expect(TIER_HIERARCHY[3]).toBe("legacy");
  });
});

describe("tierMeetsRequirement", () => {
  it("free tier only meets free requirement", () => {
    expect(tierMeetsRequirement("free", "free")).toBe(true);
    expect(tierMeetsRequirement("free", "remember")).toBe(false);
    expect(tierMeetsRequirement("free", "heritage")).toBe(false);
    expect(tierMeetsRequirement("free", "legacy")).toBe(false);
  });

  it("legacy tier meets all requirements", () => {
    expect(tierMeetsRequirement("legacy", "free")).toBe(true);
    expect(tierMeetsRequirement("legacy", "remember")).toBe(true);
    expect(tierMeetsRequirement("legacy", "heritage")).toBe(true);
    expect(tierMeetsRequirement("legacy", "legacy")).toBe(true);
  });

  it("heritage tier meets heritage and below", () => {
    expect(tierMeetsRequirement("heritage", "free")).toBe(true);
    expect(tierMeetsRequirement("heritage", "remember")).toBe(true);
    expect(tierMeetsRequirement("heritage", "heritage")).toBe(true);
    expect(tierMeetsRequirement("heritage", "legacy")).toBe(false);
  });

  it("treats undefined tier as free", () => {
    expect(tierMeetsRequirement(undefined, "free")).toBe(true);
    expect(tierMeetsRequirement(undefined, "remember")).toBe(false);
  });
});
