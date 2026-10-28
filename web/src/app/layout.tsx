import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { STORAGE_FACTS, TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://fuzedrive.tech",
  ),
  title: {
    default: `Combine Free Cloud Storage into One ${TOTAL_FREE_STORAGE_GB} GB Drive | Fuze Drive`,
    template: "%s",
  },
  description:
    `Combine free Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox storage into one unified ${TOTAL_FREE_STORAGE_GB} GB drive. 100% open source, free, direct browser-to-cloud streams.`,
  authors: [{ name: "Aftab Alam", url: "https://aftabalam.me" }],
  creator: "Aftab Alam",
  publisher: "Aftab Alam",
  alternates: {
    canonical: "https://fuzedrive.tech",
  },
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
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#2563EB" },
    ],
  },
  openGraph: {
    title: `Combine Free Cloud Storage into One ${TOTAL_FREE_STORAGE_GB} GB Drive | Fuze Drive`,
    description:
      `Combine free Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox storage into one unified ${TOTAL_FREE_STORAGE_GB} GB drive. 100% open source, free, direct browser-to-cloud streams.`,
    url: "https://fuzedrive.tech",
    siteName: "Fuze Drive",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `Fuze Drive — Combine Free Cloud Storage into One ${TOTAL_FREE_STORAGE_GB} GB Drive`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Combine Free Cloud Storage into One ${TOTAL_FREE_STORAGE_GB} GB Drive | Fuze Drive`,
    description:
      `Combine free Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox storage into one unified ${TOTAL_FREE_STORAGE_GB} GB drive. 100% open source, free, direct browser-to-cloud streams.`,
    creator: "@CodeItAftab",
    site: "@CodeItAftab",
    images: ["/twitter-card.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Fuze Drive",
      url: "https://fuzedrive.tech",
      description:
        `Combine free Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox storage into one ${TOTAL_FREE_STORAGE_GB} GB drive.`,
      potentialAction: {
        "@type": "SearchAction",
        target: "https://fuzedrive.tech/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Fuze Drive",
      url: "https://fuzedrive.tech",
      logo: "https://fuzedrive.tech/brand/fuze-logo.png",
      sameAs: [
        "https://github.com/CodeItAftab/fuze",
        "https://twitter.com/CodeItAftab",
      ],
    },
  ];

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
