"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  X,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Facebook,
  Linkedin,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui";

interface ShareData {
  title: string;
  text?: string;
  url: string;
}

interface NativeShareProps {
  /** Share data */
  data: ShareData;
  /** Custom trigger button */
  trigger?: React.ReactNode;
  /** Callback after successful share */
  onShare?: (method: string) => void;
  /** Whether to show QR code option */
  showQrCode?: boolean;
}

type ShareMethod =
  | "native"
  | "copy"
  | "sms"
  | "email"
  | "facebook"
  | "twitter"
  | "whatsapp"
  | "linkedin";

export function NativeShare({
  data,
  trigger,
  onShare,
  showQrCode = false,
}: NativeShareProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleShare = useCallback(async () => {
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        onShare?.("native");
        return;
      } catch (err) {
        // User cancelled - don't show fallback
        if ((err as Error).name === "AbortError") {
          return;
        }
        // Share failed, show fallback
      }
    }
    // Show fallback share dialog
    setShowFallback(true);
  }, [data, onShare]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      onShare?.("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = data.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      onShare?.("copy");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data.url, onShare]);

  const shareVia = useCallback(
    (method: ShareMethod) => {
      const encodedUrl = encodeURIComponent(data.url);
      const encodedTitle = encodeURIComponent(data.title);
      const encodedText = encodeURIComponent(data.text || data.title);

      let shareUrl: string | null = null;

      switch (method) {
        case "sms":
          // iOS and Android handle SMS differently
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          shareUrl = isIOS
            ? `sms:&body=${encodedText}%20${encodedUrl}`
            : `sms:?body=${encodedText}%20${encodedUrl}`;
          break;
        case "email":
          shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          break;
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
          break;
        case "whatsapp":
          shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
        onShare?.(method);
        setShowFallback(false);
      }
    },
    [data, onShare]
  );

  return (
    <>
      {/* Trigger button */}
      {trigger ? (
        <div onClick={handleShare}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      )}

      {/* Fallback share dialog */}
      <AnimatePresence>
        {showFallback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowFallback(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-dark">Share</h3>
                <button
                  onClick={() => setShowFallback(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 mx-4 mt-4 rounded-xl">
                <p className="font-medium text-gray-dark text-sm truncate">
                  {data.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">{data.url}</p>
              </div>

              {/* Share options */}
              <div className="p-4">
                <div className="grid grid-cols-4 gap-4">
                  <ShareOption
                    icon={Copy}
                    label={copied ? "Copied!" : "Copy Link"}
                    color="bg-gray-100"
                    iconColor={copied ? "text-green-600" : "text-gray-600"}
                    onClick={copyToClipboard}
                    active={copied}
                  />
                  <ShareOption
                    icon={MessageCircle}
                    label="Messages"
                    color="bg-green-100"
                    iconColor="text-green-600"
                    onClick={() => shareVia("sms")}
                  />
                  <ShareOption
                    icon={Mail}
                    label="Email"
                    color="bg-blue-100"
                    iconColor="text-blue-600"
                    onClick={() => shareVia("email")}
                  />
                  <ShareOption
                    icon={WhatsAppIcon}
                    label="WhatsApp"
                    color="bg-emerald-100"
                    iconColor="text-emerald-600"
                    onClick={() => shareVia("whatsapp")}
                  />
                  <ShareOption
                    icon={Facebook}
                    label="Facebook"
                    color="bg-blue-100"
                    iconColor="text-blue-600"
                    onClick={() => shareVia("facebook")}
                  />
                  <ShareOption
                    icon={XTwitterIcon}
                    label="X"
                    color="bg-gray-100"
                    iconColor="text-gray-800"
                    onClick={() => shareVia("twitter")}
                  />
                  <ShareOption
                    icon={Linkedin}
                    label="LinkedIn"
                    color="bg-blue-100"
                    iconColor="text-blue-700"
                    onClick={() => shareVia("linkedin")}
                  />
                  {showQrCode && (
                    <ShareOption
                      icon={QrCode}
                      label="QR Code"
                      color="bg-purple-100"
                      iconColor="text-purple-600"
                      onClick={() => {
                        setShowQr(true);
                        setShowFallback(false);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Cancel button */}
              <div className="p-4 pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowFallback(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code modal */}
      <AnimatePresence>
        {showQr && (
          <QRCodeModal
            url={data.url}
            title={data.title}
            onClose={() => setShowQr(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ShareOption({
  icon: Icon,
  label,
  color,
  iconColor,
  onClick,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  iconColor: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 active:scale-95 transition-transform"
    >
      <div
        className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}
      >
        {active ? (
          <Check className="w-6 h-6 text-green-600" />
        ) : (
          <Icon className={`w-6 h-6 ${iconColor}`} />
        )}
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </button>
  );
}

// X (Twitter) icon
function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// WhatsApp icon
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// QR Code modal (simplified - would need QR library in production)
function QRCodeModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  // In production, use a QR code library like 'qrcode.react'
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
      >
        <h3 className="font-semibold text-lg text-gray-dark mb-2">
          Scan to Visit
        </h3>
        <p className="text-sm text-gray-500 mb-4">{title}</p>

        <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-48 h-48"
            loading="lazy"
          />
        </div>

        <p className="text-xs text-gray-400 mt-4 truncate">{url}</p>

        <Button variant="outline" className="w-full mt-4" onClick={onClose}>
          Close
        </Button>
      </motion.div>
    </motion.div>
  );
}

/**
 * Simple share button with native sharing
 */
export function ShareButton({
  url,
  title,
  text,
  className,
}: {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
}) {
  const handleShare = useCallback(async () => {
    const shareData = {
      title: title || document.title,
      text: text,
      url: url || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      // Fallback to copy
      await navigator.clipboard.writeText(shareData.url);
    }
  }, [url, title, text]);

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 ${className}`}
      aria-label="Share"
    >
      <Share2 className="w-5 h-5" />
    </button>
  );
}

/**
 * Hook for programmatic sharing
 */
export function useNativeShare() {
  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { share, canShare, copyToClipboard };
}
