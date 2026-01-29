"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Loader2 } from "lucide-react";

interface QRMemorialCodeProps {
  memorialId: string;
  memorialUrl?: string;
  deceasedName: string;
  profilePhotoUrl?: string;
  birthYear?: string;
  deathYear?: string;
  showDownloadOptions?: boolean;
}

type QRSize = "small" | "medium" | "large" | "print";
type QRStyle = "simple" | "framed" | "elegant";

const QR_SIZES: Record<QRSize, number> = {
  small: 128,
  medium: 200,
  large: 300,
  print: 512,
};

export function QRMemorialCode({
  memorialId,
  memorialUrl,
  deceasedName,
  profilePhotoUrl,
  birthYear,
  deathYear,
  showDownloadOptions = true,
}: QRMemorialCodeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<QRSize>("medium");
  const [style, setStyle] = useState<QRStyle>("framed");
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render QR on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate the memorial URL (only on client)
  const url = memorialUrl || (mounted ? `${window.location.origin}/memorial/${memorialId}` : `/memorial/${memorialId}`);

  const lifespan = birthYear && deathYear ? `${birthYear} - ${deathYear}` : "";

  // Download QR code as PNG
  const downloadQR = async (downloadSize: QRSize = "print") => {
    setIsDownloading(true);

    try {
      // Create a temporary canvas for high-res download
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const qrSize = QR_SIZES[downloadSize];
      const padding = style === "simple" ? 20 : 40;
      const headerHeight = style === "simple" ? 0 : 80;
      const footerHeight = style === "simple" ? 0 : 60;

      canvas.width = qrSize + padding * 2;
      canvas.height = qrSize + padding * 2 + headerHeight + footerHeight;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (style !== "simple") {
        // Border
        ctx.strokeStyle = "#a7c9a2"; // sage
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Header text
        ctx.fillStyle = "#4a6741"; // sage-dark
        ctx.font = `bold ${Math.max(16, qrSize / 15)}px 'Playfair Display', serif`;
        ctx.textAlign = "center";
        ctx.fillText(deceasedName, canvas.width / 2, padding + 30);

        if (lifespan) {
          ctx.font = `${Math.max(12, qrSize / 20)}px sans-serif`;
          ctx.fillStyle = "#666666";
          ctx.fillText(lifespan, canvas.width / 2, padding + 55);
        }
      }

      // Draw QR code
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      // Create QR code on temp canvas
      const qrCanvas = document.querySelector(`#qr-download-canvas-${memorialId}`) as HTMLCanvasElement;
      if (qrCanvas) {
        const qrY = style === "simple" ? padding : padding + headerHeight;
        ctx.drawImage(qrCanvas, padding, qrY, qrSize, qrSize);
      }

      // Footer text
      if (style !== "simple") {
        ctx.fillStyle = "#888888";
        ctx.font = `${Math.max(10, qrSize / 25)}px sans-serif`;
        ctx.fillText("Scan to visit memorial", canvas.width / 2, canvas.height - padding - 20);
        ctx.fillText("Forever Fields", canvas.width / 2, canvas.height - padding);
      }

      // Download
      const link = document.createElement("a");
      link.download = `${deceasedName.replace(/\s+/g, "-")}-memorial-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading QR code:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download as SVG
  const downloadSVG = () => {
    const svgElement = document.querySelector(`#qr-svg-${memorialId}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.download = `${deceasedName.replace(/\s+/g, "-")}-memorial-qr.svg`;
    link.href = svgUrl;
    link.click();

    URL.revokeObjectURL(svgUrl);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memorial QR Code</CardTitle>
        <CardDescription>
          Print for headstones, funeral programs, or memorial cards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          {/* QR Code Preview */}
          <div className="flex-shrink-0">
            <div
              ref={canvasRef}
              className={`bg-white p-4 rounded-lg shadow-inner inline-block ${
                style === "framed" ? "border-2 border-sage" : ""
              } ${style === "elegant" ? "border-4 border-double border-sage-dark" : ""}`}
            >
              {style !== "simple" && (
                <div className="text-center mb-3">
                  <p className="font-display text-lg text-sage-dark">{deceasedName}</p>
                  {lifespan && <p className="text-sm text-gray-500">{lifespan}</p>}
                </div>
              )}

              {/* Visible QR (SVG for display) - only render on client */}
              {mounted ? (
                <QRCodeSVG
                  id={`qr-svg-${memorialId}`}
                  value={url}
                  size={QR_SIZES[size]}
                  level="H"
                  includeMargin={false}
                  fgColor="#4a6741"
                  bgColor="#ffffff"
                  imageSettings={
                    profilePhotoUrl
                      ? {
                          src: profilePhotoUrl,
                          height: QR_SIZES[size] * 0.2,
                          width: QR_SIZES[size] * 0.2,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              ) : (
                <div
                  className="flex items-center justify-center bg-sage-pale/30"
                  style={{ width: QR_SIZES[size], height: QR_SIZES[size] }}
                >
                  <Loader2 className="w-8 h-8 text-sage animate-spin" />
                </div>
              )}

              {/* Hidden canvas for download */}
              {mounted && (
                <div className="hidden">
                  <QRCodeCanvas
                    id={`qr-download-canvas-${memorialId}`}
                    value={url}
                    size={QR_SIZES.print}
                    level="H"
                    includeMargin={false}
                    fgColor="#4a6741"
                    bgColor="#ffffff"
                  />
                </div>
              )}

              {style !== "simple" && (
                <p className="text-center text-xs text-gray-400 mt-3">
                  Scan to visit memorial
                </p>
              )}
            </div>
          </div>

          {/* Options */}
          {showDownloadOptions && (
            <div className="flex-1 space-y-4">
              {/* Size selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Preview Size
                </label>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as QRSize[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-3 py-1 rounded text-sm capitalize ${
                        size === s
                          ? "bg-sage text-white"
                          : "bg-sage-pale text-sage-dark hover:bg-sage-light"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Style
                </label>
                <div className="flex gap-2">
                  {(["simple", "framed", "elegant"] as QRStyle[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-3 py-1 rounded text-sm capitalize ${
                        style === s
                          ? "bg-sage text-white"
                          : "bg-sage-pale text-sage-dark hover:bg-sage-light"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Download buttons */}
              <div className="pt-4 border-t space-y-2">
                <Button
                  onClick={() => downloadQR("print")}
                  disabled={isDownloading}
                  className="w-full"
                >
                  {isDownloading ? "Generating..." : "Download PNG (High-Res)"}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadSVG}
                  className="w-full"
                >
                  Download SVG (Vector)
                </Button>
              </div>

              {/* Usage tips */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>• PNG is best for printing on paper or engraving</p>
                <p>• SVG scales perfectly for any size</p>
                <p>• For outdoor use, consider weatherproof materials</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
