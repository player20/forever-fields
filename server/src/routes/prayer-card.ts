/**
 * Prayer Card PDF Generation
 * Create printable prayer cards with portrait, bio, and QR code
 */

import { Router } from 'express';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import QRCode from 'qrcode';
import { prisma } from '../config/database';
import { apiRateLimiter } from '../middleware/security';

const router = Router();

// Define fonts for pdfmake
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

/**
 * GET /api/prayer-card/:memorialId
 * Generate printable prayer card PDF
 */
router.get('/:memorialId', apiRateLimiter, async (req, res) => {
  try {
    const { memorialId } = req.params;
    const { design = 'minimalist' } = req.query;

    // Get memorial with full details
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        deceasedName: true,
        birthDate: true,
        deathDate: true,
        shortBio: true,
        portraitUrl: true,
        isPet: true,
      },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Generate QR code as base64
    const memorialUrl = `${process.env.FRONTEND_URL || 'https://foreverfields.com'}/memorial?id=${memorialId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(memorialUrl, {
      errorCorrectionLevel: 'H',
      width: 200,
      margin: 1,
      color: {
        dark: '#2c3338',
        light: '#ffffff',
      },
    });

    // Format dates
    const formatDate = (date: Date | null) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const birthDateStr = formatDate(memorial.birthDate);
    const deathDateStr = formatDate(memorial.deathDate);

    // Calculate age if both dates available
    let ageStr = '';
    if (memorial.birthDate && memorial.deathDate) {
      const birth = new Date(memorial.birthDate);
      const death = new Date(memorial.deathDate);
      let age = death.getFullYear() - birth.getFullYear();
      const monthDiff = death.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
        age--;
      }
      ageStr = memorial.isPet ? `${age} years loved` : `Age ${age}`;
    }

    // Create PDF document definition (4x6 prayer card, double-sided)
    const docDefinition: TDocumentDefinitions = {
      pageSize: {
        width: 4 * 72, // 4 inches = 288 points
        height: 6 * 72, // 6 inches = 432 points
      },
      pageMargins: [20, 20, 20, 20],
      content: [
        // FRONT SIDE
        ({
          stack: [
            // Border decoration
            {
              canvas: [
                {
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 248,
                  h: 392,
                  lineWidth: 2,
                  lineColor: '#8b9f82',
                },
              ],
            },
            // Portrait (if available)
            memorial.portraitUrl
              ? {
                  image: memorial.portraitUrl,
                  width: 120,
                  height: 120,
                  alignment: 'center',
                  margin: [0, 30, 0, 15],
                }
              : {
                  text: memorial.isPet ? '🐾' : '🌿',
                  fontSize: 48,
                  alignment: 'center',
                  margin: [0, 40, 0, 20],
                },
            // Name
            {
              text: memorial.deceasedName,
              fontSize: 18,
              bold: true,
              alignment: 'center',
              margin: [0, 0, 0, 5],
              color: '#2c3338',
            },
            // Dates
            {
              text: `${birthDateStr} — ${deathDateStr}`,
              fontSize: 11,
              alignment: 'center',
              margin: [0, 0, 0, 3],
              color: '#4a5568',
            },
            // Age
            ageStr
              ? {
                  text: ageStr,
                  fontSize: 10,
                  alignment: 'center',
                  margin: [0, 0, 0, 15],
                  color: '#4a5568',
                  italics: true,
                }
              : {},
            // Divider
            {
              canvas: [
                {
                  type: 'line',
                  x1: 40,
                  y1: 0,
                  x2: 208,
                  y2: 0,
                  lineWidth: 1,
                  lineColor: '#c5d1bc',
                },
              ],
              margin: [0, 0, 0, 15],
            },
            // Bio
            {
              text: memorial.shortBio || 'Forever in our hearts',
              fontSize: 10,
              alignment: 'center',
              margin: [20, 0, 20, 20],
              color: '#4a5568',
              lineHeight: 1.4,
            },
            // Footer quote
            {
              text: memorial.isPet
                ? '"Until we meet again at the Rainbow Bridge"'
                : '"Those we love don\'t go away, they walk beside us every day"',
              fontSize: 8,
              alignment: 'center',
              margin: [20, 10, 20, 0],
              color: '#8b9f82',
              italics: true,
            },
          ],
        } as any),
        // PAGE BREAK
        { text: '', pageBreak: 'after' },
        // BACK SIDE
        {
          stack: [
            // Border decoration
            {
              canvas: [
                {
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 248,
                  h: 392,
                  lineWidth: 2,
                  lineColor: '#8b9f82',
                },
              ],
            },
            // Title
            {
              text: 'Visit Their Memorial',
              fontSize: 16,
              bold: true,
              alignment: 'center',
              margin: [0, 40, 0, 15],
              color: '#2c3338',
            },
            // QR Code
            {
              image: qrCodeDataUrl,
              width: 180,
              height: 180,
              alignment: 'center',
              margin: [0, 0, 0, 15],
            },
            // Instructions
            {
              text: 'Scan with your phone camera\nto view their online memorial',
              fontSize: 10,
              alignment: 'center',
              margin: [0, 0, 0, 20],
              color: '#4a5568',
              lineHeight: 1.3,
            },
            // URL (small text)
            {
              text: 'foreverfields.com',
              fontSize: 8,
              alignment: 'center',
              margin: [0, 10, 0, 0],
              color: '#8b9f82',
            },
            // Forever Fields branding
            {
              text: '🌿 Forever Fields',
              fontSize: 10,
              alignment: 'center',
              margin: [0, 30, 0, 0],
              color: '#8b9f82',
            },
            {
              text: 'Where memories live forever',
              fontSize: 8,
              alignment: 'center',
              margin: [0, 3, 0, 0],
              color: '#8b9f82',
              italics: true,
            },
          ],
        },
      ],
      defaultStyle: {
        font: 'Roboto',
      },
    };

    // Create PDF
    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="prayer-card-${memorial.deceasedName.replace(/\s+/g, '-')}.pdf"`
    );

    // Pipe PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Prayer card generation error:', error);
    return res.status(500).json({ error: 'Failed to generate prayer card' });
  }
});

export default router;
