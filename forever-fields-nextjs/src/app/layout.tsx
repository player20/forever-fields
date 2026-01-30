import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { InstallPrompt, ServiceWorkerProvider } from "@/components/pwa";
import { Providers } from "@/components/providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Forever Fields - Smart Memorial Platform",
    template: "%s | Forever Fields",
  },
  description: "Create beautiful, living tribute pages for your loved ones with AI-powered memory assistance, timelines, and more.",
  keywords: ["memorial", "tribute", "obituary", "remembrance", "legacy", "family history"],
  authors: [{ name: "Forever Fields" }],
  creator: "Forever Fields",
  manifest: "/api/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Forever Fields",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://foreverfields.com",
    siteName: "Forever Fields",
    title: "Forever Fields - Smart Memorial Platform",
    description: "Create beautiful, living tribute pages for your loved ones",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Forever Fields",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Forever Fields - Smart Memorial Platform",
    description: "Create beautiful, living tribute pages for your loved ones",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a7c9a2",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ServiceWorkerProvider />
            {children}
            <ToastProvider />
            <InstallPrompt />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
