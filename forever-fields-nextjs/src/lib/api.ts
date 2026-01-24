// API utilities with error handling and retry logic

import {
  ApiError,
  NetworkError,
  TimeoutError,
  parseApiError,
  isRetryableError,
  logError,
} from "./errors";

// Configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// Types
interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number[];
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

// Create abort controller with timeout
function createTimeoutController(timeout: number): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  return { controller, timeoutId };
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main fetch wrapper with error handling and retry
export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = RETRY_DELAYS,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    const { controller, timeoutId } = createTimeoutController(timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        const error = await parseApiError(response);

        // Don't retry client errors (4xx except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw error;
        }

        throw error;
      }

      // Parse response
      const contentType = response.headers.get("content-type");
      let data: T;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else if (contentType?.includes("text/")) {
        data = (await response.text()) as T;
      } else {
        data = (await response.blob()) as T;
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new TimeoutError(`Request timed out after ${timeout}ms`);
      }
      // Handle network errors
      else if (error instanceof TypeError && error.message.includes("fetch")) {
        lastError = new NetworkError("Failed to connect to server");
      }
      // Other errors
      else if (error instanceof Error) {
        lastError = error;
      }

      // Check if we should retry
      if (attempt < retries && isRetryableError(lastError)) {
        const delayMs = retryDelay[attempt] || retryDelay[retryDelay.length - 1];
        logError(lastError, { attempt, url, willRetry: true, delayMs });

        await delay(delayMs);
        attempt++;
        continue;
      }

      // Log and throw final error
      logError(lastError, { attempt, url, willRetry: false });
      throw lastError;
    }
  }

  throw lastError || new ApiError("Request failed after retries");
}

// Convenience methods
export const api = {
  get: <T = unknown>(url: string, options?: FetchOptions) =>
    apiFetch<T>(url, { ...options, method: "GET" }),

  post: <T = unknown>(url: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = unknown>(url: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = unknown>(url: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(url: string, options?: FetchOptions) =>
    apiFetch<T>(url, { ...options, method: "DELETE" }),
};

// File upload helper
export async function uploadFile(
  url: string,
  file: File,
  options?: FetchOptions & { onProgress?: (progress: number) => void }
): Promise<ApiResponse<unknown>> {
  const formData = new FormData();
  formData.append("file", file);

  // Note: For progress tracking, would need XMLHttpRequest or fetch with ReadableStream
  // This is a simplified version
  return apiFetch(url, {
    ...options,
    method: "POST",
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary
    headers: {
      ...options?.headers,
    },
  });
}

// Stream response handler for AI endpoints
export async function* streamResponse(
  url: string,
  options?: FetchOptions
): AsyncGenerator<string, void, unknown> {
  const { timeout = 60000, ...fetchOptions } = options || {};
  const { controller, timeoutId } = createTimeoutController(timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw await parseApiError(response);
    }

    if (!response.body) {
      throw new ApiError("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(`Stream timed out after ${timeout}ms`);
    }

    throw error;
  }
}

// Check if online
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Wait for online
export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const handler = () => {
      window.removeEventListener("online", handler);
      resolve();
    };

    window.addEventListener("online", handler);
  });
}
