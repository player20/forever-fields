// ======================
// API Response Types
// Standardized response format for all API endpoints
// ======================

import type { ERROR_CODES } from "@/lib/constants";

// ======================
// Success Response
// ======================
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

// ======================
// Error Response
// ======================
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  fields?: Record<string, string[]>; // For validation errors
}

// ======================
// Combined Response Type
// ======================
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ======================
// Metadata Types
// ======================
export interface ApiMeta {
  pagination?: PaginationMeta;
  rateLimit?: RateLimitMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface RateLimitMeta {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// ======================
// Request Types
// ======================
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ======================
// API Context (for middleware)
// ======================
export interface ApiContext {
  user?: ApiUser;
  requestId?: string;
  startTime?: number;
}

export interface ApiUser {
  id: string;
  email: string;
  subscriptionTier?: string;
}

// ======================
// Type Guards
// ======================
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
}

// ======================
// Error Code Type (from constants)
// ======================
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
