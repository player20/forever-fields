"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  AppError,
  getErrorMessage,
  isRetryableError,
  logError,
  NetworkError,
} from "@/lib/errors";
import { isOnline } from "@/lib/api";

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  onError?: (error: unknown) => void;
  retryOnOnline?: boolean;
}

interface ErrorState {
  error: Error | null;
  isError: boolean;
  message: string | null;
  code: string | null;
  isRetryable: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    showToast = true,
    logToConsole = true,
    onError,
    retryOnOnline = false,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    message: null,
    code: null,
    isRetryable: false,
  });

  const [isOffline, setIsOffline] = useState(!isOnline());
  const [pendingRetry, setPendingRetry] = useState<(() => void) | null>(null);

  // Track online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (pendingRetry) {
        toast.info("You're back online. Retrying...");
        pendingRetry();
        setPendingRetry(null);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning("You're offline. Some features may not work.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pendingRetry]);

  // Handle error
  const handleError = useCallback(
    (error: unknown, retryFn?: () => void) => {
      const message = getErrorMessage(error);
      const code = error instanceof AppError ? error.code : "UNKNOWN";
      const isRetryableErr = isRetryableError(error);

      setErrorState({
        error: error instanceof Error ? error : new Error(String(error)),
        isError: true,
        message,
        code,
        isRetryable: isRetryableErr,
      });

      // Log error
      if (logToConsole) {
        logError(error);
      }

      // Show toast
      if (showToast) {
        if (error instanceof NetworkError && !isOnline()) {
          toast.error("You're offline", {
            description: "Please check your internet connection.",
            duration: 5000,
          });

          // Set up retry when back online
          if (retryOnOnline && retryFn) {
            setPendingRetry(() => retryFn);
          }
        } else if (isRetryableErr && retryFn) {
          toast.error(message, {
            description: "Click to retry",
            action: {
              label: "Retry",
              onClick: () => {
                setErrorState({
                  error: null,
                  isError: false,
                  message: null,
                  code: null,
                  isRetryable: false,
                });
                retryFn();
              },
            },
            duration: 10000,
          });
        } else {
          toast.error(message);
        }
      }

      // Call custom error handler
      onError?.(error);
    },
    [showToast, logToConsole, onError, retryOnOnline]
  );

  // Clear error
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      message: null,
      code: null,
      isRetryable: false,
    });
  }, []);

  // Wrap async function with error handling
  const wrapAsync = useCallback(
    <T extends unknown[], R>(
      fn: (...args: T) => Promise<R>,
      options?: { retryable?: boolean }
    ) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          clearError();
          return await fn(...args);
        } catch (error) {
          const retryFn = options?.retryable
            ? () => wrapAsync(fn, options)(...args)
            : undefined;
          handleError(error, retryFn);
          return undefined;
        }
      };
    },
    [handleError, clearError]
  );

  // Try-catch helper
  const tryCatch = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: { retryable?: boolean; fallback?: T }
    ): Promise<T | undefined> => {
      try {
        clearError();
        return await fn();
      } catch (error) {
        const retryFn = options?.retryable
          ? () => tryCatch(fn, options)
          : undefined;
        handleError(error, retryFn);
        return options?.fallback;
      }
    },
    [handleError, clearError]
  );

  return {
    ...errorState,
    isOffline,
    handleError,
    clearError,
    wrapAsync,
    tryCatch,
  };
}

// Simpler hook for just showing error toasts
export function useErrorToast() {
  const showError = useCallback((error: unknown) => {
    const message = getErrorMessage(error);
    toast.error(message);
    logError(error);
  }, []);

  const showSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const showWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  const showInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}

// Hook for async operations with loading and error states
export function useAsyncOperation<T = unknown>() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fn();
        setData(result);
        return result;
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);
        toast.error(getErrorMessage(error));
        logError(error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setData(null);
    setError(null);
  }, []);

  return {
    isLoading,
    data,
    error,
    isError: error !== null,
    execute,
    reset,
  };
}
