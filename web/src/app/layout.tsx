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
    process.env.NEXT_PUBLIC_APP_URL || "https://fuze.aftabalam.me",
  ),
  title: {
    default: "Fuze | Unify 42 GB Free Cloud Storage into One Personal Drive",
    template: "%s | Fuze Cloud Storage",
  },
  description:
    "Combine your free Google Drive (15 GB), Box (10 GB), pCloud (10 GB), OneDrive (5 GB), and Dropbox (2 GB) into a single 42 GB high-speed personal cloud. Zero server transit, whole-file priority, and 100% free open-source.",
  keywords: [
    "combine cloud storage",
    "free cloud storage aggregator",
    "merge google drive and onedrive",
    "unify free cloud storage",
    "multi cloud storage aggregator",
    "zero proxy cloud storage",
    "open source personal cloud drive",
    "combine box dropbox pcloud google drive",
    "cloud drive merger free",
    "distributed cloud storage",
    "virtual file system multi cloud",
    "free 42gb cloud storage",
  ],
  authors: [{ name: "Aftab Alam", url: "https://aftabalam.me" }],
  creator: "Aftab Alam",
  publisher: "Aftab Alam",
  alternates: {
    canonical: "https://fuze.aftabalam.me",
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
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Fuze | Unify 42 GB Free Cloud Storage into One Personal Drive",
    description:
      "Combine Google Drive, Box, pCloud, OneDrive, and Dropbox into one ultra-fast personal cloud with zero server proxy and native previews.",
    url: "https://fuze.aftabalam.me",
    siteName: "Fuze Storage",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fuze — Unify All Your Free Cloud Storage into One 42 GB Drive",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fuze | Unify 42 GB Free Cloud Storage into One Personal Drive",
    description:
      "Combine Google Drive, Box, pCloud, OneDrive, and Dropbox into one personal cloud. 100% Free & Open Source.",
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
      "@type": "WebApplication",
      name: "Fuze",
      alternateName: "Fuze Cloud Storage",
      url: "https://fuze.aftabalam.me",
      applicationCategory:
        "UtilitiesApplication, ProductivityApplication, CloudStorage",
      operatingSystem: "Web, Windows, macOS, Linux, iOS, Android",
      offers: {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "USD",
      },
      description:
        "Combine your free storage across Google Drive (15 GB), Box (10 GB), pCloud (10 GB), OneDrive (5 GB), and Dropbox (2 GB) into one unified 42 GB personal drive. Direct-to-cloud zero-proxy streaming, whole file priority, and 100% free open-source.",
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
          name: "How does Fuze combine 42 GB of free cloud storage into one drive?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Fuze connects your individual free cloud storage quotas—Google Drive (15 GB), Box (10 GB), pCloud (10 GB), OneDrive (5 GB), and Dropbox (2 GB)—into a single unified Virtual File System (VFS). An intelligent allocation engine stores files whole on the fastest available cloud and only chunks files when they exceed individual limits.",
          },
        },
        {
          "@type": "Question",
          name: "Is Fuze really 100% free with no monthly subscription?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Fuze is 100% free and open-source under the MIT license. Because Fuze uses a zero-proxy architecture where files stream directly between your browser and cloud provider APIs, Fuze incurs virtually zero storage transit costs and passes that savings directly to you with no credit card required.",
          },
        },
        {
          "@type": "Question",
          name: "Does Fuze see, proxy, or store my personal files on its servers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Fuze utilizes direct-to-cloud presigned resumable URLs. Your raw files travel directly between your browser and the respective cloud provider endpoints (Google, Microsoft, Box, Dropbox, pCloud). Fuze never buffers, intercepts, or hosts your file contents.",
          },
        },
        {
          "@type": "Question",
          name: "Which cloud storage providers can I connect to Fuze?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Fuze natively supports Google Drive, Box, pCloud, Microsoft OneDrive, and Dropbox, aggregating up to 42 GB of free storage with native video, document, and image thumbnail previews.",
          },
        },
        {
          "@type": "Question",
          name: "What happens if a file is larger than a single provider's free space?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Fuze automatically falls back to Rule 2: Multi-Cloud Dynamic Chunking. The file is split into cryptographic chunks, distributed across remaining connected clouds, and verified using SHA-256 Merkle root trees.",
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Fuze Storage",
      url: "https://fuze.aftabalam.me",
      founder: {
        "@type": "Person",
        name: "Aftab Alam",
        url: "https://aftabalam.me",
      },
      sameAs: [
        "https://github.com/CodeItAftab/fuze",
        "https://aftabalam.me",
      ],
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
