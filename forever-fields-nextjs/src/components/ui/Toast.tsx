"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { Check, X, AlertTriangle, Info, Loader2 } from "lucide-react";

// Re-export toast function with custom styling
export const toast = {
  success: (message: string, options?: { description?: string }) => {
    sonnerToast.success(message, {
      description: options?.description,
      icon: <Check className="w-5 h-5 text-success" />,
    });
  },
  error: (message: string, options?: { description?: string }) => {
    sonnerToast.error(message, {
      description: options?.description,
      icon: <X className="w-5 h-5 text-error" />,
    });
  },
  warning: (message: string, options?: { description?: string }) => {
    sonnerToast.warning(message, {
      description: options?.description,
      icon: <AlertTriangle className="w-5 h-5 text-gold" />,
    });
  },
  info: (message: string, options?: { description?: string }) => {
    sonnerToast.info(message, {
      description: options?.description,
      icon: <Info className="w-5 h-5 text-twilight" />,
    });
  },
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      icon: <Loader2 className="w-5 h-5 text-sage animate-spin" />,
    });
  },
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },
};

// Toaster provider component - add to layout
export function ToastProvider() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: "font-sans",
        style: {
          background: "white",
          border: "1px solid rgba(167, 201, 162, 0.2)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(167, 201, 162, 0.15)",
          padding: "16px",
        },
        duration: 4000,
      }}
      closeButton
      richColors
      expand
    />
  );
}

// Inline toast for specific contexts
interface InlineToastProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  description?: string;
  onDismiss?: () => void;
  className?: string;
}

export function InlineToast({
  type,
  message,
  description,
  onDismiss,
  className,
}: InlineToastProps) {
  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const styles = {
    success: "bg-success/10 border-success/20 text-success",
    error: "bg-error/10 border-error/20 text-error",
    warning: "bg-gold/10 border-gold/20 text-gold-dark",
    info: "bg-twilight/10 border-twilight/20 text-twilight",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type]} ${className}`}
      role="alert"
    >
      <span className="shrink-0 mt-0.5">{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{message}</p>
        {description && (
          <p className="mt-1 text-sm opacity-80">{description}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
