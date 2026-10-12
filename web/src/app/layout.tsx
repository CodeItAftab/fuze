import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Fuze — All your cloud storage, fused into one",
    template: "%s | Fuze",
  },
  description:
    "Pool your Google Drive, OneDrive, Dropbox, and Box accounts into one unified, ultra-fast personal cloud with zero server proxy.",
  keywords: [
    "cloud storage",
    "distributed storage",
    "google drive alternative",
    "free cloud storage pooling",
    "zero proxy personal cloud",
    "resumable multi-cloud uploader",
  ],
  authors: [{ name: "Fuze Storage" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#3B82F6" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Fuze — All your cloud storage, fused into one",
    description:
      "Connect your cloud drives and manage every file in one place with zero server proxy.",
    url: "https://fuze.storage",
    siteName: "Fuze",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fuze — All your cloud storage, fused into one",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fuze — All your cloud storage, fused into one",
    description:
      "Connect your cloud drives and manage every file in one place.",
    images: ["/twitter-card.png"],
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
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#0F172A" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
