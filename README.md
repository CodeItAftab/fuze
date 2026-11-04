# Fuze Drive ⚡📁

> **Open-Source, Direct-to-Cloud Personal Storage Aggregator** — Pool free storage tiers across **Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox** into a unified **72 GB** high-speed virtual drive with **direct client-to-cloud transfers** and zero server bandwidth proxying.

🌐 **Live Demo & Web App**: [https://fuzedrive.tech](https://fuzedrive.tech)

<p align="left">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" height="20" /></a>&nbsp;
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.4-black.svg" alt="Next.js 16" height="20" /></a>&nbsp;
  <a href="https://fastify.dev"><img src="https://img.shields.io/badge/Fastify-5.2-white.svg" alt="Fastify" height="20" /></a>&nbsp;
  <a href="https://www.postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-16-336791.svg" alt="PostgreSQL" height="20" /></a>&nbsp;
  <a href="https://orm.drizzle.team"><img src="https://img.shields.io/badge/Drizzle-ORM-C5F74F.svg" alt="Drizzle ORM" height="20" /></a>&nbsp;
  <a href="https://redis.io"><img src="https://img.shields.io/badge/Redis-Cache%20%26%20Locks-DC382D.svg" alt="Redis" height="20" /></a>&nbsp;
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6.svg" alt="TypeScript" height="20" /></a>
</p>

---

## 📖 Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. System Architecture](#2-system-architecture)
  - [The Zero-Proxy Paradigm](#the-zero-proxy-paradigm)
  - [High-Level Architecture Diagram](#high-level-architecture-diagram)
- [3. Key Innovations & Engineering Concepts](#3-key-innovations--engineering-concepts)
  - [Rule 1: Whole-File High-Speed Priority](#rule-1-whole-file-high-speed-priority)
  - [Rule 2: Multi-Cloud Dynamic Chunking & Merkle Trees](#rule-2-multi-cloud-dynamic-chunking--merkle-trees)
  - [Cross-Provider Native Thumbnail Engine](#cross-provider-native-thumbnail-engine)
  - [Cross-User Cloud Account Collision Protection](#cross-user-cloud-account-collision-protection)
  - [Account Deletion with Selective Cloud Purge](#account-deletion-with-selective-cloud-purge)
  - [Distributed Token Refresh Locking (Redis)](#distributed-token-refresh-locking-redis)
  - [Real-Time WebSocket State Synchronization](#real-time-websocket-state-synchronization)
- [4. Supported Cloud Providers](#4-supported-cloud-providers)
- [5. Repository Structure](#5-repository-structure)
- [6. Database Schema & Data Models](#6-database-schema--data-models)
- [7. Getting Started & Local Development](#7-getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation & Startup](#installation--startup)
  - [Running Database Migrations](#running-database-migrations)
- [8. Production Deployment Guide](#8-production-deployment-guide)
- [9. Contributing & Roadmap](#9-contributing--roadmap)
- [10. License & Author](#10-license--author)

---

## 1. Executive Summary

Every major cloud provider offers a modest consumer free tier:
* **MEGA**: 20 GB
* **Google Drive**: 15 GB
* **Box**: 10 GB (250 MB single-file upload limit)
* **pCloud**: 10 GB (starts at 2 GB, unlock up to 10 GB via onboarding)
* **Koofr**: 10 GB (connects via secure WebDAV App Password)
* **Microsoft OneDrive**: 5 GB
* **Dropbox**: 2 GB

Individually, these quotas are easily exhausted. Managing files scattered across 7 distinct logins and interfaces creates fragmentation. Worse, commercial multi-cloud aggregators charge $10–$25/month, impose monthly data traffic caps (e.g. 5 GB/month), or proxy all your private files through their proprietary servers.

**Fuze Drive** solves this permanently:
* **Combines Free Quotas**: Connect accounts via standard OAuth2 or secure credentials to instantly aggregate up to **72 GB** of free personal storage (20 GB + 15 GB + 10 GB + 10 GB + 10 GB + 5 GB + 2 GB = 72 GB).
* **Zero-Proxy Architecture**: File uploads and standard downloads stream **directly** between your browser and cloud provider REST endpoints. The Fuze Drive server never touches, buffers, or hosts your raw data library.
* **Smart Whole-File Priority**: Files are prioritized to upload intact as single objects to the fastest available provider. Multi-cloud chunking is strictly reserved as an intelligent fallback when individual quotas or file size ceilings are exceeded.
* **100% Free & Open Source**: Released under the MIT license with zero commercial lock-in, credit cards, or recurring fees.

---

## 2. System Architecture

### The Zero-Proxy Paradigm

Traditional cloud uploaders act as a bandwidth-heavy middleman:

```
[Traditional Model - High Cost, High Latency, Privacy Risk]
Client ────────(Full File Payload)────────► App Server ────────(Full File Payload)────────► Cloud Provider
                                           (Buffers GBs in RAM / Bandwidth Bottleneck)
```

In Fuze, **the server orchestrates metadata only**:

```
[Fuze Zero-Proxy Model]
1. Client ──(Metadata Request: "Upload 4GB video")──► Fuze Server
2. Client ◄──(Plan: Presigned Resumable Cloud URLs)─── Fuze Server
3. Client ══════════════(Direct HTTP PUT Stream: 0 KB Server Transit)══════════════► Cloud Provider
4. Client ──(Confirmation: Chunk Hash & File ID)──► Fuze Server
```

#### Why Zero-Proxy Matters:
1. **Zero Bandwidth Costs**: The server handles only lightweight JSON metadata. It can comfortably run on a free-tier hosting instance without network saturation.
2. **Maximum Throughput**: Transfers saturate your connection directly against Google, MEGA, Microsoft, Box, Dropbox, Koofr, and pCloud CDNs.
3. **True Privacy**: Your raw file payloads stream directly between your browser and cloud provider endpoints.

### High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT BROWSER (Next.js 16)                              │
│                                                                                        │
│   ┌────────────────────────────────┐            ┌──────────────────────────────────┐   │
│   │       React 19 Dashboard       │            │        Client Upload Queue       │   │
│   │  (Drive Explorer, File Grid,   │ ─────────► │ (Direct Resumable Streams,       │   │
│   │   Breadcrumbs, Previews, Trash)│            │  Chunking, SHA-256 Merkle Roots) │   │
│   └────────────────────────────────┘            └────────────────┬─────────────────┘   │
└───────────────────────┬──────────────────────────────────────────┼─────────────────────┘
                        │ Control Plane (JSON / WebSockets)        │ Data Plane Only
                        │                                          │ (Direct HTTP Binary Stream)
                        ▼                                          ▼
┌────────────────────────────────────────────────┐┌──────────────────────────────────────┐
│          Fuze Drive Backend (Fastify)          ││        Connected Cloud Providers     │
│                                                ││                                      │
│  • Fastify REST API & Auth (JWT + Cookies)     ││  • MEGA (Encrypted Storage / 20 GB)  │
│  • Virtual File System (VFS Subtree Trees)     ││  • Google Drive (Resumable Sessions) │
│  • Chunk Decision Engine (Whole vs Chunked)    ││  • Box (Upload API / 120+ Previews)  │
│  • Native Thumbnail Engine (Atomic LRU Cache)  ││  • Koofr (WebDAV App Password / 10 GB│
│  • Safe Token Refresh Management               ││  • pCloud (Direct REST API / EU & US)│
│  • Drizzle ORM + PostgreSQL Database           ││  • Microsoft OneDrive (Graph API)    │
│  • WebSocket Manager (Real-time Broadcasts)    ││  • Dropbox (Upload Sessions v2)      │
└────────────────────────────────────────────────┘└──────────────────────────────────────┘
```

---

## 3. Key Innovations & Engineering Concepts

### Rule 1: Whole-File High-Speed Priority
Rather than blindly fragmenting every file across multiple clouds, Fuze's allocation engine enforces **strict whole-file prioritization**:
* When a file is uploaded, the engine scans all active, unrevoked providers to see if **any single provider** has sufficient free space and supports the file size.
* If a fit exists, the file is designated strategy `"whole"`, weighted by provider speed:
  $\\text{MEGA (105)} > \\text{Google Drive (100)} > \\text{pCloud (95)} > \\text{OneDrive (90)} > \\text{Koofr (88)} > \\text{Box (85)} > \\text{Dropbox (70)}$
* **Benefits**: 0 chunking overhead, maximum download throughput, and instant cloud-native preview availability.

### Rule 2: Multi-Cloud Dynamic Chunking & Merkle Trees
When a large file (e.g., 20 GB video or database dump) exceeds the remaining space of any single provider:
* Fuze automatically executes **Rule 2**: splitting the file into discrete chunks across multiple connected accounts.
* Each chunk is hashed using client-side **SHA-256**, and a hierarchical **Merkle Tree Root** is computed and verified by the backend before finalization.

### Cross-Provider Native Thumbnail Engine
* Rather than requiring server-side FFmpeg processing for video frames or heavy LibreOffice rendering for documents, Fuze queries the native preview APIs of the underlying storage providers:
  * **Google Drive**: `=s400` high-res preview stream
  * **OneDrive**: Microsoft Graph `/thumbnails/0/medium/content`
  * **Box**: Box API native `/thumbnail.png` (supports 120+ formats)
  * **Dropbox**: `/files/get_thumbnail_v2` with `w256h256`
  * **pCloud**: `/getthumb?size=256x256`
* Backed by a server-side **Atomic LRU Disk Cache** with configurable quotas (`THUMBNAIL_CACHE_MAX_MB`), automated TTL eviction, ETag validation, and client-side graphic card fallbacks.

### Cross-User Cloud Account Collision Protection
* To prevent unauthorized access or file corruption, Fuze enforces strict cross-user account isolation.
* During OAuth callbacks, the server verifies that the incoming cloud email address is not already registered by any other Fuze user.
* If a conflict is detected, the connection is safely aborted and the user is alerted.

### Account Deletion with Selective Cloud Purge
When a user deletes their Fuze profile, they are provided a choice:
1. **Unlink Only (Default)**: Wipes all metadata and credentials from Fuze. Physical files remain safely in their respective cloud accounts.
2. **Complete Cloud Purge**: Automatically queries all stored files and chunks across Google Drive, Box, pCloud, OneDrive, and Dropbox, dispatching parallel deletion requests (`adapter.deleteFile`) before cascading database deletion.

### Distributed Token Refresh Locking (Redis)
When a user performs multiple parallel uploads or downloads, multiple chunks may attempt to refresh an expired OAuth access token simultaneously. Fuze implements a **distributed lock using Redis**:
* Only the first request acquires the lock and exchanges the refresh token.
* Concurrent requests await the cached new token, completely eliminating race conditions and provider rate-limiting.

### Real-Time WebSocket State Synchronization
All Virtual File System actions (file creation, folder nesting, renaming, moving, trash restoration, and storage quota adjustments) broadcast user-scoped WebSocket events (`FILE_CREATED`, `FILE_RENAMED`, `QUOTA_UPDATED`, `SESSION_REVOKED`) ensuring instant multi-tab and multi-device state consistency.

### Zero-Proxy Direct CDN Streaming & Client-Side In-Memory Assembly
To deliver high-speed, zero-buffering media playback and file previews:
* **Single Whole Files**: Stream directly via **HTTP 307 Temporary Redirects** straight to pre-authenticated cloud CDN URLs (Dropbox `dl.dropboxusercontent.com`, Microsoft Azure CDN for OneDrive, Box Akamai CDN, and pCloud CDN) with **0 MB server bandwidth transit**.
* **Zero-Buffering In-Memory Playback (`downloadAndAssembleChunks`)**: For multi-cloud chunked files and media files $\le 80$ MB, chunks are downloaded concurrently in parallel into browser memory and assembled into a local `blob:` URL. Playback begins in 1–2 seconds with **zero buffering** and **instantaneous 0 ms scrubbing/seeking**.
* **Strict CORS Compliance**: All media players omit `crossOrigin="use-credentials"`, completely eliminating cross-origin credential wildcard errors when requesting ranges from global storage CDNs.
* **Signed Short-Lived Stream Tokens**: The Fastify control plane generates secure 6-hour JWT stream tokens (`?token=...`), allowing HTML5 `<video>` and `<audio>` players to stream authenticated files without cross-origin cookie blockers.
* **Full HTTP Range Support**: Fastify's CORS engine explicitly whitelists the `Range` request header and exposes `Content-Range`, `Accept-Ranges`, and `Content-Length` response headers.

### Per-Account Identity Isolation & Non-Destructive File Reconciliation
* **Multi-Account Identity Isolation**: Users can connect multiple cloud accounts across providers. Identity checks are scoped strictly to active accounts (`is_disconnected = false AND is_revoked = false`), allowing an email previously disconnected from one account to be freely attached to another without collision blocks.
* **Non-Destructive VFS Index Reconciliation**: When a previously disconnected provider is re-attached, a background worker runs lightweight existence checks (`adapter.verifyFileExists`) against remote storage. Files and chunks are reconciled non-destructively, preserving existing VFS records and restoring instant access without risk of accidental data purging.

### Cross-Cloud Zero-Data-Loss Migration Worker
When moving files between clouds or safely disconnecting a provider:
* The background migration engine relocates chunks across connected clouds using parallel transfer channels.
* **Zero-Loss Guarantee**: If any individual chunk cannot be relocated due to provider capacity or network timeouts, the original chunks and database records are strictly preserved on the source cloud to guarantee zero data loss.
---

## 4. Supported Cloud Providers

| Provider | Free Tier | Single-File Limit | Native Previews | Auth & Upload Protocol |
| :--- | :---: | :---: | :---: | :--- |
| **MEGA** | **20 GB** | 20 GB (Quota Limit) | Images, Audio, Media | End-to-End Encrypted MEGA API |
| **Google Drive** | **15 GB** | 5 TB | Images, Videos, PDFs, Docs | Google Resumable Upload Session (OAuth 2.0) |
| **Box** | **10 GB** | 250 MB | 120+ Formats (Images, Office, Code) | Box Chunked Upload API (OAuth 2.0) |
| **pCloud** | **10 GB** | 10 GB | Images, Videos, PDFs, Audio | pCloud Direct REST Multipart (EU & US OAuth 2.0) |
| **Koofr** | **10 GB** | 10 GB | Images, Documents, Media | Secure WebDAV App Password Connection |
| **Microsoft OneDrive** | **5 GB** | 250 GB | Images, Videos, Office 365 Previews | Graph API Resumable Upload Session (OAuth 2.0) |
| **Dropbox** | **2 GB** | 2 GB (Free quota limit; 350 GB via API) | Images, Videos, Docs | Dropbox Upload Sessions v2 (OAuth 2.0) |
| **Total Unified Pool** | **72 GB** | — | **Universal** | **Direct Browser-to-Cloud Uploads** |

---

## 5. Repository Structure

```
fuze/
├── server/                         # Fastify Backend Service
│   ├── src/
│   │   ├── adapters/               # Multi-Cloud Storage Adapters
│   │   │   ├── base.adapter.ts     # StorageAdapter Interface
│   │   │   ├── box.adapter.ts      # Box API Integration
│   │   │   ├── dropbox.adapter.ts  # Dropbox API Integration
│   │   │   ├── gdrive.adapter.ts   # Google Drive v3 Integration
│   │   │   ├── koofr.adapter.ts    # Koofr WebDAV Integration
│   │   │   ├── mega.adapter.ts     # MEGA API Integration
│   │   │   ├── onedrive.adapter.ts # Microsoft Graph Integration
│   │   │   ├── pcloud.adapter.ts   # pCloud REST Integration
│   │   │   └── factory.ts          # Adapter Factory
│   │   ├── db/                     # Drizzle ORM Schema & Migrations
│   │   │   └── schema.ts           # PostgreSQL Table Definitions
│   │   ├── routes/                 # REST Route Handlers
│   │   │   ├── auth.routes.ts      # Auth, Sessions & Account Deletion
│   │   │   ├── files.routes.ts     # VFS File Operations & Thumbnails
│   │   │   ├── providers.routes.ts # OAuth Connect, Sync & Collision Check
│   │   │   └── uploads.routes.ts   # Resumable Upload Sessions
│   │   ├── services/               # Core Business Logic
│   │   │   ├── chunk-decision.service.ts # Whole-File Priority & Chunking Engine
│   │   │   ├── quota.service.ts    # Cloud Quota Calculation & Refresh
│   │   │   ├── thumbnail-cache.service.ts# Atomic LRU Thumbnail Disk Cache
│   │   │   ├── token.service.ts    # Token Refresh with Safe Key Management
│   │   │   ├── upload-session.service.ts # Upload Session Lifecycle
│   │   │   └── vfs.service.ts      # Virtual File System Tree Engine
│   │   ├── websocket/              # Real-Time Event Broadcasting
│   │   ├── workers/                # BullMQ Background Job Workers
│   │   └── index.ts                # Application Entrypoint & Server Setup
│   ├── package.json
│   └── tsconfig.json
│
├── web/                            # Next.js 16 Web Dashboard & Marketing
│   ├── src/
│   │   ├── app/                    # App Router Pages
│   │   │   ├── (auth)/             # Login, Register, Verify Email
│   │   │   ├── compare/            # Neutral MultCloud Alternative Comparison
│   │   │   ├── dashboard/          # Drive Explorer, Storage, Settings, Trash
│   │   │   ├── faq/                # SEO Structured FAQ & Knowledge Base
│   │   │   ├── guides/             # 4 In-Depth Storage & Provider Guides
│   │   │   ├── how-it-works/       # Technical Architecture Walkthrough
│   │   │   ├── layout.tsx          # Root Layout & SEO Schema.org Generators
│   │   │   ├── page.tsx            # Interactive 7-Cloud Storage Calculator & Landing
│   │   │   ├── privacy/            # GDPR/CCPA Privacy Policy
│   │   │   ├── terms/              # Terms of Service
│   │   │   ├── robots.ts           # Dynamic robots.txt
│   │   │   └── sitemap.ts          # Dynamic sitemap.xml (29 verified routes)
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── brand/              # Fuze Drive Vector Logos & Assets
│   │   │   ├── drive/              # DriveView, Sidebar, ProviderBadge, Previews
│   │   │   ├── landing/            # LandingNavbar, Calculator, DriveMockup
│   │   │   └── storage/            # AvailableCloudCard, ConnectCredentialsModal
│   │   ├── lib/                    # facts.ts Single-Source-of-Truth, Upload Queue
│   │   └── stores/                 # Zustand Global State Stores
│   ├── package.json
│   └── tsconfig.json
│
├── ARCHITECTURE.md                 # Deep Technical Architecture Documentation
├── LICENSE                         # MIT License
├── SECURITY.md                     # Vulnerability Reporting & Security Policy
└── README.md                       # Main Documentation (This File)
```

---

## 6. Database Schema & Data Models

Fuze utilizes **PostgreSQL** with **Drizzle ORM**:

* **`users`**: User identities, bcrypt password hashes, and email verification status.
* **`user_sessions`**: Database-backed sessions for instant multi-device revocation.
* **`provider_identities`**: Linked cloud accounts, encrypted OAuth access/refresh tokens (AES-256-GCM), live quotas, and revocation states.
* **`vfs_nodes`**: Hierarchical Virtual File System nodes (folders and files) with parent-child adjacency, path metadata, and soft trash timestamps.
* **`file_chunks`**: Maps finalized virtual files to specific cloud providers and their respective remote `provider_file_id`s.
* **`upload_sessions` & `upload_chunks`**: Tracks stateful, 7-day resumable upload sessions with byte ranges, provider session URLs, and chunk completion hashes.

---

## 7. Getting Started & Local Development

### Prerequisites

To run Fuze locally, you need the following dependencies:
* **Node.js**: v20.x or higher (`node -v`)
* **npm** or **pnpm**
* **PostgreSQL Database**: v15.x or higher
* **Redis Server**: v7.x or higher (Required for distributed locks, BullMQ queue, and session revocation)

---

### Infrastructure Setup: PostgreSQL & Redis

Fuze relies on **PostgreSQL** for relational VFS metadata and **Redis** for distributed token refresh locks, session invalidation, and background upload queue processing. You can set them up locally via Docker or use free cloud tiers with zero local installation.

#### Option A: Quickstart via Docker (Recommended for Local Dev)
If you have Docker installed, you can spin up both PostgreSQL and Redis with a single command:

```bash
# Run PostgreSQL 16 container
docker run -d --name fuze-postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fuze postgres:16-alpine

# Run Redis 7 container
docker run -d --name fuze-redis -p 6379:6379 redis:7-alpine
```

Alternatively, create a `docker-compose.yml` in your project root:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: fuze-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fuze
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: fuze-redis
    restart: always
    ports:
      - "6379:6379"

volumes:
  pgdata:
```
Then start them with:
```bash
docker compose up -d
```

#### Option B: Standalone Native Installation

* **Redis Setup**:
  * **Why Fuze needs Redis**: When multiple chunk uploads fire in parallel and an OAuth token expires, Fuze acquires a distributed Redis lock (`SET lock:token:refresh:<id> EX 10 NX`) to ensure only one worker refreshes the token, preventing OAuth `invalid_grant` token revocation errors.
  * **macOS (Homebrew)**:
    ```bash
    brew install redis
    brew services start redis
    ```
  * **Linux (Ubuntu / Debian)**:
    ```bash
    sudo apt update && sudo apt install redis-server -y
    sudo systemctl enable --now redis-server
    ```
  * **Windows**:
    * Run via **WSL 2** (`sudo apt install redis-server && sudo service redis-server start`)
    * Or use [Memurai for Windows](https://www.memurai.com) (native Redis-compatible Windows daemon).

* **PostgreSQL Setup**:
  * Download and install PostgreSQL 15+ from [postgresql.org](https://www.postgresql.org/download/).
  * Create a database named `fuze` using `psql` or pgAdmin:
    ```sql
    CREATE DATABASE fuze;
    ```

#### Option C: 100% Free Cloud Managed Services (Zero Local Installation)
If you do not want to install databases locally, you can use generous free cloud tiers:
* **Database (PostgreSQL)**: Create a free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com). Copy the pooled connection string into `DATABASE_URL`.
* **Redis**: Create a free serverless Redis database on [Upstash](https://upstash.com) (free 10,000 commands/day). Copy the `rediss://default:...@...upstash.io:6379` connection string into `REDIS_URL`. Both local development and production work seamlessly with Upstash TLS URIs.

---

### Generating Cryptographic Secrets

Fuze requires two cryptographically secure secret keys:
1. `JWT_SECRET`: For signing and verifying user access and refresh tokens.
2. `ENCRYPTION_KEY`: A **32-byte (64 hex characters)** key used by AES-256-GCM to encrypt provider OAuth access and refresh tokens at rest in the database.

Generate them in your terminal using `openssl` or Node.js:
```bash
# Generate JWT_SECRET (32-byte Base64)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (32-byte Hex for AES-256-GCM)
openssl rand -hex 32
```
*(Or via Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)*

---

### Cloud Provider Credentials & OAuth Setup

To link cloud drives, configure the connection methods below (or review our step-by-step [Connect Cloud Providers Guide](https://fuzedrive.tech/guides/connect-cloud-providers)):

| Provider | Connection Type | Setup Requirements | Authorized Redirect / Details |
| :--- | :--- | :--- | :--- |
| **MEGA** | Direct API Credentials | Free account on [mega.io](https://mega.io/register) | User credentials encrypted at rest via AES-256-GCM |
| **Google Drive** | OAuth 2.0 | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (`drive.file` scope) | `http://localhost:4000/providers/google/callback` |
| **Box** | OAuth 2.0 | [Box Developer Console](https://app.box.com/developers/console) (`Read/write all files`) | `http://localhost:4000/providers/box/callback` |
| **pCloud** | OAuth 2.0 | [pCloud App Portal](https://docs.pcloud.com/my_apps/) | `http://localhost:4000/providers/pcloud/callback` |
| **Koofr** | WebDAV App Password | [Koofr Preferences](https://app.koofr.net/app/admin/preferences/password) | Generated App Password encrypted via AES-256-GCM |
| **OneDrive** | OAuth 2.0 | [Microsoft Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps) (`Files.ReadWrite`) | `http://localhost:4000/providers/onedrive/callback` |
| **Dropbox** | OAuth 2.0 PKCE | [Dropbox App Console](https://www.dropbox.com/developers/apps) (`files.content.write/read`) | `http://localhost:4000/providers/dropbox/callback` |

> [!TIP]
> You do **not** need to configure all 7 providers to start development. You can configure just one (e.g. Google Drive, MEGA, or Koofr) and link others anytime.

---

### Environment Variables

#### 1. Server Configuration (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```bash
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# Authentication & Encryption Secrets
JWT_SECRET=your_generated_jwt_secret_at_least_32_characters
COOKIE_SECRET=your_cookie_signing_secret_32_bytes_hex
ENCRYPTION_KEY=your_generated_64_character_hex_key_for_aes_256_gcm

# Database & Cache Connections
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuze
REDIS_URL=redis://localhost:6379

# Google Drive OAuth (Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/providers/google/callback

# Microsoft OneDrive OAuth (Azure Portal)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:4000/providers/onedrive/callback

# Dropbox OAuth (Dropbox App Console)
DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_SECRET=your_dropbox_app_secret
DROPBOX_REDIRECT_URI=http://localhost:4000/providers/dropbox/callback

# Box OAuth (Box Developer Portal)
BOX_CLIENT_ID=your_box_client_id
BOX_CLIENT_SECRET=your_box_client_secret
BOX_REDIRECT_URI=http://localhost:4000/providers/box/callback

# pCloud OAuth (pCloud Developer Portal)
PCLOUD_CLIENT_ID=your_pcloud_client_id
PCLOUD_CLIENT_SECRET=your_pcloud_client_secret
PCLOUD_REDIRECT_URI=http://localhost:4000/providers/pcloud/callback

# Optional: Email Notifications (Resend / Brevo)
EMAIL_FROM="Fuze Cloud <onboarding@resend.dev>"
RESEND_API_KEY=your_resend_api_key

# Optional: Thumbnail LRU Disk Cache Configuration
THUMBNAIL_CACHE_MAX_MB=150
THUMBNAIL_CACHE_DIR=.cache/thumbnails
THUMBNAIL_CACHE_TTL_DAYS=14
```

#### 2. Web Configuration (`web/.env.local`)
Create `web/.env.local` based on `web/.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Step-by-Step Installation & Startup

```bash
# 1. Clone the repository
git clone https://github.com/CodeItAftab/fuze.git
cd fuze

# 2. Install backend dependencies
cd server
npm install

# 3. Push Database Schema to PostgreSQL
npm run db:push

# 4. Start the Backend API Server
npm run dev

# 5. (Optional) In another terminal, start the BullMQ Worker
cd server
npm run dev:worker

# 6. In a new terminal, install frontend dependencies and start web app
cd ../web
npm install
npm run dev
```

Visit **`http://localhost:3000`** in your browser. Create an account, connect your cloud drives in **Settings**, and start managing your pooled 72 GB personal drive!

---

## 8. Production Deployment Guide

Fuze Drive is designed for **zero-cost, 24/7 deployment** with no credit card required:

1. **Frontend (`web`)**:
   * Deploy to **Vercel** (Hobby plan, 100% free forever).
   * Set custom domain to `fuzedrive.tech`.
   * Configure environment variables:
     * `NEXT_PUBLIC_API_URL=https://api.fuzedrive.tech`
     * `NEXT_PUBLIC_WS_URL=wss://api.fuzedrive.tech`
     * `NEXT_PUBLIC_APP_URL=https://fuzedrive.tech`
2. **Backend (`server`)**:
   * Deploy to an **Oracle Cloud Infrastructure (OCI) Free Tier ARM Ampere VM** (4 OCPU, 24 GB RAM, 200 GB SSD — 100% free forever) or Render/Railway/Fly.io.
   * Run the production server under **PM2** (`pm2 start dist/index.js --name fuze-api`) behind a reverse proxy (Caddy / Nginx) with automated Let's Encrypt SSL on `api.fuzedrive.tech`.
   * Add a free keep-alive monitor via [cron-job.org](https://cron-job.org) hitting `/health` every 10 minutes to ensure 99.99% uptime.
3. **Database**:
   * Deploy to **Supabase** or **Neon** (Free 500 MB PostgreSQL).
4. **Cache & Queue**:
   * Deploy to **Upstash** (Free 10,000 commands/day serverless Redis).

---

## 9. Contributing & Roadmap

We welcome contributions from developers worldwide! 

### How to Contribute:
1. **Fork** the repository.
2. **Create a branch** for your feature (`git checkout -b feature/mediafire-adapter`).
3. **Commit** your changes (`git commit -m 'Add MediaFire storage adapter'`).
4. **Push** to your branch (`git push origin feature/mediafire-adapter`).
5. Open a **Pull Request**.

### Roadmap:
* **Priority 1: Expanding Free Cloud Storage Adapters (Current: 72 GB Pool | Target: 100+ GB)**
  - [x] **Google Drive, Box, pCloud, OneDrive, Dropbox** (Initial 42 GB Base)
  - [x] **MEGA Adapter** (+20 GB free tier, pushing pool to 62 GB)
  - [x] **Koofr WebDAV Adapter** (+10 GB free tier, pushing pool to 72 GB)
  - [ ] **MediaFire Adapter** (+10 GB free tier, pushing pool to 82 GB)
  - [ ] **Proton Drive Adapter** (+5 GB free tier, Swiss zero-knowledge privacy)
  - [ ] **IceDrive & Yandex Disk Adapters** (+20 GB combined free tiers)
* **Priority 2: Client Encryption & Privacy**
  - [ ] Client-side zero-knowledge encryption using WebCrypto AES-GCM
* **Priority 3: Secondary Object Stores & CI**
  - [ ] S3-compatible and self-hosted connectors (Nextcloud, MinIO, WebDAV, Cloudflare R2)
  - [ ] Automated end-to-end integration test suite with GitHub Actions CI

---

## 10. License & Author

* **Created & Maintained by**: [Aftab Alam](https://aftabalam.me) ([@CodeItAftab](https://github.com/CodeItAftab))
* **License**: Released under the permissive **[MIT License](LICENSE)**.
