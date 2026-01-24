/**
 * API Client for Forever Fields Backend
 *
 * Connects to the existing Express.js API with httpOnly cookie authentication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Base fetch wrapper with error handling and credential support
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const config: RequestInit = {
    ...fetchOptions,
    credentials: "include", // Send httpOnly cookies
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  };

  const response = await fetch(url, config);

  // Handle non-JSON responses
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    const errorData = isJson ? await response.json() : await response.text();
    throw new ApiError(
      errorData?.error || errorData?.message || "Request failed",
      response.status,
      errorData
    );
  }

  // Return null for 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return isJson ? response.json() : (response.text() as unknown as T);
}

/**
 * API client with typed methods
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

// Auth-specific API calls
export const authApi = {
  /**
   * Request magic link for passwordless login
   */
  requestMagicLink: (email: string) =>
    api.post<{ message: string }>("/api/auth-complete/magic-link", { email }),

  /**
   * Verify magic link token
   */
  verifyMagicLink: (token: string) =>
    api.post<{ user: User; message: string }>("/api/auth-complete/verify-magic-link", { token }),

  /**
   * Login with email and password
   */
  login: (email: string, password: string) =>
    api.post<{ user: User; message: string }>("/api/auth-complete/login", {
      email,
      password,
    }),

  /**
   * Register new account
   */
  register: (data: { email: string; password: string; name?: string }) =>
    api.post<{ user: User; message: string }>("/api/auth-complete/register", data),

  /**
   * Get current user session
   */
  getSession: () =>
    api.get<{ user: User | null }>("/api/auth-complete/session"),

  /**
   * Logout and clear session
   */
  logout: () =>
    api.post<{ message: string }>("/api/auth-complete/logout"),

  /**
   * Request password reset
   */
  requestPasswordReset: (email: string) =>
    api.post<{ message: string }>("/api/auth-complete/forgot-password", { email }),

  /**
   * Reset password with token
   */
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>("/api/auth-complete/reset-password", {
      token,
      password: newPassword,
    }),
};

// Memorial API calls
export const memorialApi = {
  /**
   * Get all memorials for current user
   */
  getMyMemorials: () =>
    api.get<Memorial[]>("/api/memorials"),

  /**
   * Get a single memorial by ID
   */
  getMemorial: (id: string) =>
    api.get<Memorial>(`/api/memorials/${id}`),

  /**
   * Create a new memorial
   */
  createMemorial: (data: CreateMemorialInput) =>
    api.post<Memorial>("/api/memorials", data),

  /**
   * Update a memorial
   */
  updateMemorial: (id: string, data: Partial<Memorial>) =>
    api.put<Memorial>(`/api/memorials/${id}`, data),

  /**
   * Delete a memorial
   */
  deleteMemorial: (id: string) =>
    api.delete<{ message: string }>(`/api/memorials/${id}`),
};

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Memorial {
  id: string;
  user_id: string;
  deceased_name: string;
  birth_date?: string;
  death_date?: string;
  short_bio?: string;
  full_obituary?: string;
  cover_image_url?: string;
  profile_image_url?: string;
  is_public: boolean;
  memorial_type: "human" | "pet";
  created_at: string;
  updated_at: string;
}

export interface CreateMemorialInput {
  deceased_name: string;
  birth_date?: string;
  death_date?: string;
  short_bio?: string;
  memorial_type?: "human" | "pet";
  is_public?: boolean;
}
