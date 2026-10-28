# Fuze Drive Claims Register

This claims register catalogs all public factual claims made across https://fuzedrive.tech and the `CodeItAftab/fuze` repository as part of Phase 1 of the Accuracy and Legal Safety audit.

- **Audit Date**: October 28, 2026
- **Status Categories**:
  - `VERIFIED-IN-CODE`: Confirmed by current source implementation in `server/` or `web/`.
  - `VERIFIED-EXTERNAL`: Confirmed by external official provider documentation (with cited URL).
  - `UNVERIFIED`: Unsubstantiated, outdated, misleading, or conflicting with the actual codebase.

---

## 1. Inventory of Public Routes & Components

### Public Routes
1. `/` (Homepage: `web/src/app/page.tsx`)
2. `/how-it-works` (`web/src/app/how-it-works/page.tsx`)
3. `/faq` (`web/src/app/faq/page.tsx`)
4. `/compare/multcloud-alternative` (`web/src/app/compare/multcloud-alternative/page.tsx`)
5. `/guides/combine-google-drive-onedrive-dropbox` (`web/src/app/guides/combine-google-drive-onedrive-dropbox/page.tsx`)
6. `/guides/free-cloud-storage-comparison-2026` (`web/src/app/guides/free-cloud-storage-comparison-2026/page.tsx`)
7. `/guides/open-source-cloud-storage-aggregator` (`web/src/app/guides/open-source-cloud-storage-aggregator/page.tsx`)
8. `/privacy` (`web/src/app/privacy/page.tsx`)
9. `/terms` (`web/src/app/terms/page.tsx`)
10. `/login` (`web/src/app/(auth)/login/page.tsx`)
11. `/register` (`web/src/app/(auth)/register/page.tsx`)
12. `/forgot-password` (`web/src/app/(auth)/forgot-password/page.tsx`)

### Public Components Rendering Text
1. `AnnouncementBanner.tsx`
2. `LandingNavbar.tsx`
3. `HeroSection.tsx` & `HeroActionButtons.tsx`
4. `DriveMockup.tsx`
5. `StorageCalculator.tsx`
6. `ArchitectureSection.tsx`
7. `OpenSourceSection.tsx`
8. `AboutSection.tsx`
9. `ComparisonSection.tsx`
10. `FaqSection.tsx`
11. `BottomCtaSection.tsx`
12. `LandingFooter.tsx`
13. `MarketingHeader.tsx`
14. `MarketingFooter.tsx`
15. `MarketingCta.tsx`
16. `RelatedGuides.tsx`

### Shared Metadata & System Files
1. `web/src/app/layout.tsx` (Metadata & Site-wide JSON-LD)
2. `web/src/app/robots.ts`
3. `web/src/app/sitemap.ts`
4. `web/public/site.webmanifest`
5. `README.md`
6. `LICENSE`
7. `ARCHITECTURE.md`

---

## 2. Factual Claims Register Table

| id | claim (exact text) | file:line | category | status |
|---|---|---|---|---|
| C-001 | "OAuth refresh and access tokens are encrypted before being saved to the database." / "AES-256-GCM Token Encryption" | `web/src/app/how-it-works/page.tsx:222` | security/privacy | VERIFIED-IN-CODE (`server/src/utils/crypto.ts:3,16`, `server/src/services/token.service.ts:94`) |
| C-002 | "encrypted OAuth 2.0 credentials using AES-256 encryption at rest" | `web/src/app/privacy/page.tsx:76` | security/privacy | VERIFIED-IN-CODE (`server/src/utils/crypto.ts:3`) |
| C-003 | "Zero-Proxy Architecture Guarantee" / "Zero-Proxy Architecture" | `web/src/app/privacy/page.tsx:59`, `web/src/components/landing/HeroSection.tsx:16` | security/privacy | UNVERIFIED (Absolute guarantee term; must be phrased descriptively as direct browser-to-cloud transfers) |
| C-004 | "Fuze servers never proxy, download, inspect, or store your raw file contents." | `web/src/app/privacy/page.tsx:62` | security/privacy | UNVERIFIED (While uploads/downloads stream directly for supported single-file flows, server generates/caches thumbnails in `server/src/services/thumbnail-cache.service.ts` and handles provider auth headers) |
| C-005 | "Server never touches or buffers file payloads" / "Server never touches file payloads" | `web/src/app/compare/multcloud-alternative/page.tsx:57` | security/privacy | UNVERIFIED (Must be softened: "Fuze servers don't store or relay your uploads and downloads. They keep folder metadata and cached previews/thumbnails.") |
| C-006 | "0 KB of file payload touches Fuze servers." | `web/src/app/how-it-works/page.tsx:63` | security/privacy | UNVERIFIED (Thumbnails and previews temporarily buffer preview bytes in LRU cache `thumbnail-cache.service.ts`) |
| C-007 | "No middleman server touches your data" | `web/src/app/guides/combine-google-drive-onedrive-dropbox/page.tsx:311` | security/privacy | UNVERIFIED (Absolute promise; banned phrase) |
| C-008 | "zero-knowledge" | `web/src/app/compare/multcloud-alternative/page.tsx:55` | security/privacy | UNVERIFIED (Fuze does not perform client-side zero-knowledge end-to-end encryption; file contents are known to the destination clouds) |
| C-009 | "military-grade AES-256-GCM encryption" | `web/src/app/guides/combine-google-drive-onedrive-dropbox/page.tsx:308` | security/privacy | UNVERIFIED ("military-grade" is marketing hyperbole; algorithm is AES-256-GCM) |
| C-010 | "TLS 1.3" / "encrypted endpoints (HTTPS/TLS 1.3)" | `web/src/app/guides/combine-google-drive-onedrive-dropbox/page.tsx:311` | security/privacy | UNVERIFIED (TLS version negotiated by browser and provider; not enforced specifically as 1.3 in code) |
| C-011 | "preventing any unauthorized cross-account access" | `web/src/app/guides/combine-google-drive-onedrive-dropbox/page.tsx:314` | security/privacy | UNVERIFIED (Absolute claim; collision protection blocks duplicate email linkage in DB, but cannot guarantee "any") |
| C-012 | "Fuze enforces unique email ownership across providers, preventing another user from linking your cloud drive." | `web/src/app/how-it-works/page.tsx:228` | security/privacy | VERIFIED-IN-CODE (`server/src/routes/providers.routes.ts:316-330` checks `existingProvider.userId !== user.id`) |
| C-013 | "You never enter your Google, Microsoft, Box, or Dropbox passwords on Fuze." | `web/src/app/how-it-works/page.tsx:219` | security/privacy | VERIFIED-IN-CODE (OAuth2 redirects to provider login screens; only Koofr/MEGA adapters use WebDAV/API credentials stored encrypted) |
| C-014 | "passwords are hashed with Argon2id" | `web/src/app/privacy/page.tsx:73` | security/privacy | VERIFIED-IN-CODE (`server/src/routes/auth.routes.ts` uses Argon2id for local password hashing) |
| C-015 | "Fuze connects your individual free cloud storage quotas—Google Drive (15 GB), Box (10 GB), pCloud (10 GB), OneDrive (5 GB), and Dropbox (2 GB)" | `web/src/components/landing/FaqSection.tsx:6` | storage quotas | VERIFIED-EXTERNAL (Google: https://support.google.com/googleone/answer/9312312, Box: https://www.box.com/pricing, pCloud: https://www.pcloud.com/cloud-storage-pricing-plans.html, OneDrive: https://www.microsoft.com/en-us/microsoft-365/onedrive/online-cloud-storage, Dropbox: https://www.dropbox.com/plans) |
| C-016 | "Google Drive gives 15 GB" | `web/src/components/landing/AboutSection.tsx:20` | storage quotas | VERIFIED-EXTERNAL (15 GB free; caveat: shared across Google Drive, Gmail, and Google Photos) |
| C-017 | "Box gives 10 GB" | `web/src/components/landing/AboutSection.tsx:20` | storage quotas | VERIFIED-EXTERNAL (10 GB free; caveat: 250 MB individual file upload cap on free personal accounts) |
| C-018 | "pCloud gives 10 GB" | `web/src/components/landing/AboutSection.tsx:20` | storage quotas | VERIFIED-EXTERNAL (Starts at 2 GB free; up to 10 GB through completed onboarding tasks and referrals) |
| C-019 | "OneDrive gives 5 GB" | `web/src/components/landing/AboutSection.tsx:20` | storage quotas | VERIFIED-EXTERNAL (5 GB free on free Microsoft account) |
| C-020 | "Dropbox gives 2 GB" | `web/src/components/landing/AboutSection.tsx:20` | storage quotas | VERIFIED-EXTERNAL (2 GB free on Dropbox Basic) |
| C-021 | "MEGA gives 20 GB free" | `web/src/components/landing/StorageCalculator.tsx:16` | storage quotas | VERIFIED-EXTERNAL (https://mega.io/pricing: 20 GB base storage) |
| C-022 | "Koofr gives 10 GB free" | `web/src/components/landing/StorageCalculator.tsx:18` | storage quotas | VERIFIED-EXTERNAL (https://koofr.eu/pricing/: up to 10 GB free) |
| C-023 | "42 GB personal drive" / "42 GB free unified storage" / "42.0 GB Total Available" | `web/src/app/page.tsx`, `web/src/app/compare/multcloud-alternative/page.tsx:19` | storage quotas | UNVERIFIED (Must read "up to 42 GB" or "up to 72 GB" with explicit caveats for shared/unlocked quotas) |
| C-024 | "100% Free Forever" | `web/src/components/landing/ComparisonSection.tsx:31` | pricing | UNVERIFIED ("Forever" is an unprovable promise; must be replaced with "free and open source") |
| C-025 | "100% free and open-source under the MIT license" | `web/src/components/landing/FaqSection.tsx:10` | pricing | VERIFIED-IN-CODE (`LICENSE` file exists at repository root with standard MIT text) |
| C-026 | "no credit card required" | `web/src/components/landing/BottomCtaSection.tsx:18` | pricing | VERIFIED-IN-CODE (Registration schema only requires email and password; no billing integration exists in repo) |
| C-027 | "Commercial cloud managers charge $10 to $20 every month" / "$9.90 - $24.90/mo" / "$10 – $25 / mo" | `web/src/components/landing/AboutSection.tsx:24`, `web/src/app/compare/multcloud-alternative/page.tsx:41` | competitor | UNVERIFIED (Outdated; MultCloud public pricing verified at https://www.multcloud.com/price.html on 2026-10-28 ranges from ~$19.99/mo to ~$119/yr) |
| C-028 | "MultCloud imposes a strict 5 GB per month traffic cap on free accounts" | `web/src/app/compare/multcloud-alternative/page.tsx:205` | competitor | VERIFIED-EXTERNAL (https://www.multcloud.com/price.html states Free plan includes 5 GB monthly data traffic) |
| C-029 | "forces your unencrypted files through their servers" | `web/src/app/compare/multcloud-alternative/page.tsx:205` | competitor | UNVERIFIED / FALSE (MultCloud states transfers use 256-bit AES encryption over SSL: https://www.multcloud.com/security.html) |
| C-030 | "The most frequent complaint among MultCloud free users" | `web/src/app/compare/multcloud-alternative/page.tsx:265` | competitor | UNVERIFIED (Unsubstantiated editorial claim; must be removed) |
| C-031 | "exhaust your entire monthly quota in less than ten minutes" | `web/src/app/compare/multcloud-alternative/page.tsx:265` | competitor | UNVERIFIED (Exaggerated timing; replace with neutral concrete example: "A single 6 GB video would exceed the 5 GB free monthly allowance") |
| C-032 | "account is throttled or locked until you pay" | `web/src/app/compare/multcloud-alternative/page.tsx:265` | competitor | UNVERIFIED (Neutral replacement: "transfers stop until the next month or an upgrade") |
| C-033 | "MultCloud supports 30+ cloud services" | `web/src/app/compare/multcloud-alternative/page.tsx` | competitor | VERIFIED-EXTERNAL (https://www.multcloud.com/features.html lists 30+ cloud storage services) |
| C-034 | "MultCloud: SaaS lock-in only / Proprietary closed-source commercial platform" | `web/src/app/compare/multcloud-alternative/page.tsx:71,83` | competitor | UNVERIFIED (Must be phrased neutrally: "Proprietary commercial service / As far as we can tell from public information...") |
| C-035 | "unlimited" / "zero artificial bandwidth limits" | `web/src/app/compare/multcloud-alternative/page.tsx:209` | performance | UNVERIFIED (Absolute claim; must be replaced with "no Fuze-imposed transfer cap (cloud provider rate limits and quotas still apply)") |
| C-036 | "Rule 1: Whole-File Priority" | `web/src/components/landing/ArchitectureSection.tsx:24` | architecture | VERIFIED-IN-CODE (`server/src/services/chunk-decision.service.ts:31-64` selects single largest/fastest provider when space allows) |
| C-037 | "Rule 2: Cross-Cloud Dynamic Chunking" / "SHA-256 Merkle root verification" | `web/src/components/landing/ArchitectureSection.tsx:48` | architecture | PARTLY-VERIFIED-IN-CODE (`server/src/utils/crypto.ts:49` has `computeMerkleRoot`, but runtime validation across chunk uploads is partial; must be described accurately) |
| C-038 | "Distributed Redis Token Locking: Redlock mechanism" | `web/src/app/how-it-works/page.tsx:225` | architecture | UNVERIFIED (Server uses Postgres transactions, not a Redlock Redis mechanism) |
| C-039 | "Atomic LRU thumbnail cache" | `web/src/app/how-it-works/page.tsx` | architecture | VERIFIED-IN-CODE (`server/src/services/thumbnail-cache.service.ts` implements local disk thumbnail caching with atomic temp-file rename) |
| C-040 | "Operating System: Web, Windows, macOS, Linux, iOS, Android" | `web/src/app/layout.tsx:107` | availability | PARTLY-VERIFIED (Fuze is a responsive web application that runs in any modern web browser; native desktop/mobile apps are not distributed) |

---

## 3. Immediate Action Items Flagged for Phase 2 & Phase 3

1. **Delete False/Unproven Claims**:
   - Delete "unencrypted raw bytes transit commercial servers".
   - Delete "Redlock Redis distributed token locking" (server uses Postgres).
   - Delete "military-grade", "zero-knowledge", "forever", "unlimited", "no middleman server touches your data", "zero server data transit".
2. **Soften Absolute Language**:
   - Change "42 GB" to "up to 42 GB" (or "up to 72 GB" where Koofr & MEGA are referenced) with explicit provider caveats.
   - Change "100% Free Forever" to "Free and Open Source".
   - Change "unlimited transfers" to "no Fuze-imposed transfer cap (cloud provider rate limits and quotas still apply)".
3. **Consolidate into `lib/facts.ts`**:
   - Centralize all quota numbers, caveats, verified MultCloud figures, disclaimer text, and verified dates into a single module.
