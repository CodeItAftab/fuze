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
    process.env.NEXT_PUBLIC_APP_URL || "https://fuzedrive.tech",
  ),
  title: {
    default: "Combine Free Cloud Storage into One 42 GB Drive | Fuze Drive",
    template: "%s",
  },
  description:
    "Combine free Google Drive, OneDrive, Dropbox, Box and pCloud storage into one 42 GB drive. Open source, free, files stream directly from your browser.",
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
    title: "Combine Free Cloud Storage into One 42 GB Drive | Fuze Drive",
    description:
      "Combine free Google Drive, OneDrive, Dropbox, Box and pCloud storage into one 42 GB drive. Open source, free, files stream directly from your browser.",
    url: "https://fuzedrive.tech",
    siteName: "Fuze Drive",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fuze Drive — Combine Free Cloud Storage into One 42 GB Drive",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Combine Free Cloud Storage into One 42 GB Drive | Fuze Drive",
    description:
      "Combine free Google Drive, OneDrive, Dropbox, Box and pCloud storage into one 42 GB drive. Open source, free, files stream directly from your browser.",
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
        "Combine free Google Drive, OneDrive, Dropbox, Box and pCloud storage into one 42 GB drive.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://fuzedrive.tech/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Fuze Drive",
      applicationCategory:
        "UtilitiesApplication, ProductivityApplication, CloudStorage",
      operatingSystem: "Web, Windows, macOS, Linux, iOS, Android",
      offers: {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "USD",
      },
      description:
        "Combine free Google Drive, OneDrive, Dropbox, Box and pCloud storage into one 42 GB drive. Open source, free, files stream directly from your browser.",
      author: {
        "@type": "Person",
        name: "Aftab Alam",
        url: "https://aftabalam.me",
      },
      creator: {
        "@type": "Person",
        name: "Aftab Alam",
        url: "https://aftabalam.me",
      },
      softwareVersion: "1.0",
      license: "https://opensource.org/licenses/MIT",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Fuze Drive",
      alternateName: "Fuze Cloud Drive",
      url: "https://fuzedrive.tech",
      applicationCategory:
        "UtilitiesApplication, ProductivityApplication, CloudStorage",
      operatingSystem: "Web, Windows, macOS, Linux, iOS, Android",
      offers: {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "USD",
      },
      description:
        "Combine free Google Drive, OneDrive, Dropbox, Box and pCloud storage into one 42 GB drive. Direct-to-cloud zero-proxy streaming, whole file priority, and 100% free open-source.",
      author: {
        "@type": "Person",
        name: "Aftab Alam",
        url: "https://aftabalam.me",
      },
      creator: {
        "@type": "Person",
        name: "Aftab Alam",
        url: "https://aftabalam.me",
      },
      softwareVersion: "1.0",
      license: "https://opensource.org/licenses/MIT",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does Fuze Drive combine 42 GB of free cloud storage into one drive?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Fuze Drive connects your individual free cloud storage quotas—Google Drive (15 GB), Box (10 GB), pCloud (10 GB), OneDrive (5 GB), and Dropbox (2 GB)—into a single unified Virtual File System (VFS). An intelligent allocation engine stores files whole on the fastest available cloud and only chunks files when they exceed individual limits.",
          },
        },
        {
          "@type": "Question",
          name: "Is Fuze Drive really 100% free with no monthly subscription?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Fuze Drive is 100% free and open-source under the MIT license. Because Fuze Drive uses a direct browser-to-cloud architecture where files stream directly between your browser and cloud provider APIs, Fuze Drive incurs virtually zero storage transit costs and passes that savings directly to you with no credit card required.",
          },
        },
        {
          "@type": "Question",
          name: "Does Fuze Drive see, proxy, or store my personal files on its servers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Files stream directly between your browser and the respective cloud endpoints via authorized resumable sessions. Fuze servers only store file metadata, folder hierarchies, and cached previews.",
          },
        },
        {
          "@type": "Question",
          name: "Which cloud storage providers can I connect to Fuze Drive?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Fuze Drive natively supports Google Drive, Box, pCloud, Microsoft OneDrive, and Dropbox, aggregating up to 42 GB of free storage with native video, document, and image thumbnail previews.",
          },
        },
        {
          "@type": "Question",
          name: "What happens if a file is larger than a single provider's free space?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Fuze Drive automatically falls back to Rule 2: Multi-Cloud Dynamic Chunking. The file is split into cryptographic chunks, distributed across remaining connected clouds, and verified using SHA-256 Merkle root trees.",
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Fuze Drive",
      url: "https://fuzedrive.tech",
      founder: {
        "@type": "Person",
        name: "Aftab Alam",
        url: "https://aftabalam.me",
      },
      sameAs: ["https://github.com/CodeItAftab/fuze", "https://aftabalam.me"],
    },
  ];

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
