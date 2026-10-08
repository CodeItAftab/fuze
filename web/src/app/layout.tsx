import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Fuze — Zero-Proxy Multi-Cloud Personal Storage",
    template: "%s | Fuze",
  },
  description:
    "Pool your free Google Drive, OneDrive, Dropbox, and pCloud accounts into one unified, ultra-fast personal cloud with zero server proxy.",
  keywords: [
    "cloud storage",
    "distributed storage",
    "google drive alternative",
    "free cloud storage pooling",
    "zero proxy personal cloud",
    "resumable multi-cloud uploader",
  ],
  authors: [{ name: "Fuze Storage" }],
  openGraph: {
    title: "Fuze — Pool Your Free Cloud Accounts Into One Drive",
    description:
      "Instant zero-proxy multi-cloud drive with intelligent chunking and automated failover.",
    url: "https://fuze.storage",
    siteName: "Fuze",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fuze Multi-Cloud Storage Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fuze — Zero-Proxy Multi-Cloud Personal Storage",
    description:
      "Pool your Google Drive, OneDrive, and Dropbox into one high-speed drive.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Fuze",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
    },
    description:
      "Zero-proxy distributed cloud storage aggregator that pools free tier cloud drives with intelligent chunking and resumable uploads.",
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
