/**
 * Fuze Drive — Single Source of Truth for Claims, Storage Quotas, and Verified Facts.
 * 
 * All user-facing marketing copy, calculators, FAQs, metadata, and JSON-LD
 * MUST import values from this file to ensure 100% sitewide consistency.
 * 
 * Last fact-checked against official provider documentation: October 28, 2026.
 */

export interface CloudProviderFact {
  id: string;
  name: string;
  officialFreeGb: number;
  caveat?: string;
  notes: string;
  authMethod: "oauth2" | "app_password" | "credentials";
}

export const PROVIDER_FACTS: CloudProviderFact[] = [
  {
    id: "google_drive",
    name: "Google Drive",
    officialFreeGb: 15,
    caveat: "Shared across Gmail, Google Drive, and Google Photos.",
    notes: "OAuth 2.0 authorization with narrow drive.file scope (only files opened or created by Fuze Drive).",
    authMethod: "oauth2",
  },
  {
    id: "mega",
    name: "MEGA",
    officialFreeGb: 20,
    caveat: "Free base allocation of 20 GB.",
    notes: "End-to-end encrypted storage; connects via encrypted account credentials stored using AES-256-GCM.",
    authMethod: "credentials",
  },
  {
    id: "box",
    name: "Box",
    officialFreeGb: 10,
    caveat: "Individual free accounts have a 250 MB single-file upload limit.",
    notes: "Standard OAuth 2.0 connection. Large files exceeding 250 MB are automatically chunked across other clouds.",
    authMethod: "oauth2",
  },
  {
    id: "pcloud",
    name: "pCloud",
    officialFreeGb: 10,
    caveat: "Starts at 2 GB free on signup; unlock up to 10 GB by completing basic onboarding steps and friend invites.",
    notes: "OAuth 2.0 connection to official pCloud European or US data regions.",
    authMethod: "oauth2",
  },
  {
    id: "koofr",
    name: "Koofr",
    officialFreeGb: 10,
    caveat: "Requires generating an App Password in Koofr Account Preferences -> Password.",
    notes: "Fast European cloud storage supporting secure WebDAV app password connections.",
    authMethod: "app_password",
  },
  {
    id: "one_drive",
    name: "Microsoft OneDrive",
    officialFreeGb: 5,
    caveat: "Standard Microsoft consumer free tier allocation.",
    notes: "OAuth 2.0 connection via Microsoft Graph API with Files.ReadWrite scope.",
    authMethod: "oauth2",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    officialFreeGb: 2,
    caveat: "Standard Basic consumer free tier allocation.",
    notes: "OAuth 2.0 connection via official Dropbox API v2.",
    authMethod: "oauth2",
  },
];

export const TOTAL_FREE_STORAGE_GB = 72;
export const TOTAL_CONNECTED_PROVIDERS_COUNT = 7;

export const STORAGE_FACTS = {
  totalGb: TOTAL_FREE_STORAGE_GB,
  totalProviders: TOTAL_CONNECTED_PROVIDERS_COUNT,
  displayTotal: "72 GB",
  headline: "Unify all your free cloud storage into one 72 GB personal drive.",
  headlineShort: "72 GB Personal Cloud Drive",
  caveatText:
    "Calculated by aggregating official consumer free allocations: MEGA (20 GB) + Google Drive (15 GB, shared with Gmail/Photos) + Box (10 GB, 250 MB per-file limit) + Koofr (10 GB) + pCloud (up to 10 GB via onboarding) + Microsoft OneDrive (5 GB) + Dropbox (2 GB). Individual quotas depend on each provider's current terms and any existing usage in your accounts.",
};

export const SECURITY_AND_ARCHITECTURE_FACTS = {
  license: "MIT License",
  licenseUrl: "https://github.com/CodeItAftab/fuze/blob/main/LICENSE",
  encryptionAtRest: "AES-256-GCM (Galois/Counter Mode) with 16-byte random initialization vectors and authentication tags",
  transitEncryption: "HTTPS / TLS 1.2+ enforced via modern reverse proxy infrastructure",
  streamArchitecture:
    "Direct client-side streaming for uploads and standard downloads directly between your browser and cloud provider APIs.",
  serverTransitNotes:
    "Fuze Drive does not proxy or store your raw files on disk. For optional features (such as generating thumbnail previews and inline audio/video streaming), the backend temporarily buffers requested chunks in an ephemeral cache with a 14-day TTL.",
  accountCollisionProtection:
    "Prevents multiple Fuze Drive users from claiming the same third-party cloud account email simultaneously.",
  openSourceRepo: "https://github.com/CodeItAftab/fuze",
  authorName: "Aftab Alam",
};

export const MULTCLOUD_VERIFIED_FACTS = {
  lastCheckedDate: "October 2026",
  sourcePriceUrl: "https://www.multcloud.com/price.html",
  sourceSecurityUrl: "https://www.multcloud.com/security.html",
  trademarkDisclaimer:
    "MultCloud is a registered trademark of its respective owner. Fuze Drive is an independent open-source project and is not affiliated with, endorsed by, or sponsored by MultCloud. All product names, logos, and brands are property of their respective owners. Information presented is verified from publicly available documentation as of October 2026.",
  multCloudOverview:
    "MultCloud is a comprehensive commercial multi-cloud data management platform supporting 30+ enterprise and consumer cloud services, specializing in automated cloud-to-cloud migration, schedule tasks, and centralized transfer management running on its servers.",
  fuzeOverview:
    "Fuze Drive is a specialized, open-source personal drive aggregator designed for individuals who want to pool free cloud storage quotas into a single virtual directory using direct browser-to-cloud streams with zero monthly subscriptions.",
  freeTierMultCloud: "Free tier provides 5 GB of monthly data traffic allowance (source: multcloud.com/price.html).",
  freeTierFuze: "100% free with no monthly subscription; transfer speeds and bandwidth depend solely on your direct connection to the cloud providers.",
  dataHandlingMultCloud: "Transfers use 256-bit AES encryption over SSL. Server cache is created temporarily during active tasks and removed afterward (source: multcloud.com/security.html).",
  dataHandlingFuze: "File uploads and regular downloads stream directly between your browser and cloud provider REST APIs. Server-side thumbnail caching uses AES-256 encrypted tokens at rest.",
};
