"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";

export interface PermanenceCertificateProps {
  memorialName: string;
  transactionId: string;
  arweaveUrl: string;
  archivedAt: Date;
  contentHash: string;
}

/**
 * Printable permanence certificate component
 */
export function PermanenceCertificate({
  memorialName,
  transactionId,
  arweaveUrl,
  archivedAt,
  contentHash,
}: PermanenceCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate of Permanent Preservation - ${memorialName}</title>
          <style>
            body {
              font-family: Georgia, 'Times New Roman', Times, serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .certificate {
              border: 3px double #4a5568;
              padding: 40px;
              background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .title {
              font-size: 28px;
              color: #2d3748;
              margin-bottom: 10px;
              font-weight: normal;
            }
            .subtitle {
              font-size: 14px;
              color: #718096;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .divider {
              border-top: 1px solid #cbd5e0;
              margin: 20px 0;
            }
            .content {
              text-align: center;
              margin: 30px 0;
            }
            .memorial-name {
              font-size: 24px;
              color: #2d3748;
              margin: 20px 0;
              font-style: italic;
            }
            .details {
              text-align: left;
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 30px 0;
            }
            .detail-row {
              display: flex;
              margin: 10px 0;
              font-size: 12px;
            }
            .detail-label {
              width: 140px;
              color: #718096;
            }
            .detail-value {
              flex: 1;
              font-family: monospace;
              word-break: break-all;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 11px;
              color: #718096;
            }
            .qr-placeholder {
              width: 100px;
              height: 100px;
              border: 1px dashed #cbd5e0;
              margin: 20px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #a0aec0;
            }
            @media print {
              body { padding: 0; }
              .certificate { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-4">
      <div
        ref={certificateRef}
        className="bg-gradient-to-br from-gray-50 to-gray-100 border-4 border-double border-gray-400 p-8 rounded-lg"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Certificate of
          </p>
          <h2 className="text-2xl font-serif text-gray-800">
            Permanent Preservation
          </h2>
        </div>

        <hr className="border-gray-300 my-6" />

        {/* Content */}
        <div className="text-center my-8">
          <p className="text-gray-600">This certifies that the memorial for</p>
          <p className="text-2xl font-serif italic text-gray-800 my-4">
            {memorialName}
          </p>
          <p className="text-gray-600">
            has been permanently archived on the Arweave blockchain
          </p>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg p-4 my-6">
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="w-36 text-gray-500">Transaction ID:</span>
              <span className="flex-1 font-mono text-xs break-all">
                {transactionId}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-gray-500">Content Hash:</span>
              <span className="flex-1 font-mono text-xs break-all">
                {contentHash}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-gray-500">Archived Date:</span>
              <span className="flex-1">
                {archivedAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-gray-500">Verification URL:</span>
              <span className="flex-1 text-xs break-all">{arweaveUrl}</span>
            </div>
          </div>
        </div>

        {/* QR Code placeholder */}
        <div className="flex justify-center my-6">
          <div className="w-24 h-24 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
            [QR Code]
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>
            This data is stored permanently on the Arweave network and cannot be
            deleted or modified.
          </p>
          <p className="mt-1">
            It will remain accessible for 200+ years regardless of the status of
            Forever Fields Inc.
          </p>
          <p className="mt-3 font-medium">Forever Fields</p>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={handlePrint}>
          Print Certificate
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(
              `Memorial: ${memorialName}\nTransaction: ${transactionId}\nURL: ${arweaveUrl}`
            );
          }}
        >
          Copy Details
        </Button>
      </div>
    </div>
  );
}
