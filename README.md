# Fuze ⚡📁

> **Decentralized, Zero-Proxy Personal Cloud Storage Aggregator** — Pool free storage tiers across **Google Drive, Box, pCloud, OneDrive, and Dropbox** into a unified **42 GB** high-speed virtual drive with **100% direct client-to-cloud transfers** and **zero server bandwidth proxying**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-white.svg)](https://fastify.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F.svg)](https://orm.drizzle.team)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Locks-DC382D.svg)](https://redis.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org)

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

Every major cloud provider offers a modest free storage tier:
* **Google Drive**: 15 GB
* **Box**: 10 GB
* **pCloud**: 10 GB
* **Microsoft OneDrive**: 5 GB
* **Dropbox**: 2 GB

Individually, these quotas are easily exhausted. Managing files scattered across 5 distinct logins and interfaces creates fragmentation. Worse, commercial multi-cloud aggregators charge $10–$25/month and proxy all your private files through their proprietary servers.

**Fuze** solves this permanently:
* **Combines Free Quotas**: Connect accounts via standard OAuth2 to instantly aggregate **42 GB** of free personal storage ($15 + 10 + 10 + 5 + 2\text{ GB}$).
* **Zero-Proxy Architecture**: Files stream **directly** between your browser and cloud provider endpoints via presigned resumable URLs. The Fuze server never touches, buffers, or hosts your raw data.
* **Smart Allocation**: Files are prioritized to upload intact as single objects to the fastest provider. Multi-cloud chunking is strictly reserved as a fallback when individual quotas are exceeded.
* **100% Free & Open Source**: Released under the MIT license with zero commercial lock-in.

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
2. **Maximum Throughput**: Transfers saturate your connection directly against Google, Microsoft, Box, Dropbox, and pCloud CDNs.
3. **True Privacy**: Your unencrypted bytes never touch our compute instances or database.

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
│             Fuze Backend (Fastify)             ││        Connected Cloud Providers     │
│                                                ││                                      │
│  • Fastify REST API & Auth (JWT + Cookies)     ││  • Google Drive (Resumable Sessions) │
│  • Virtual File System (VFS Subtree Trees)     ││  • Box (Upload API / 120+ Previews)  │
│  • Chunk Decision Engine (Whole vs Chunked)    ││  • pCloud (Direct REST API / EU & US)│
│  • Native Thumbnail Engine (Atomic LRU Cache)  ││  • Microsoft OneDrive (Graph API)    │
│  • Redis Token Refresh Lock (Redlock pattern)  ││  • Dropbox (Upload Sessions v2)      │
│  • Drizzle ORM + PostgreSQL Database           ││                                      │
│  • WebSocket Manager (Real-time Broadcasts)    ││                                      │
└────────────────────────────────────────────────┘└──────────────────────────────────────┘
```

---

## 3. Key Innovations & Engineering Concepts

### Rule 1: Whole-File High-Speed Priority
Rather than blindly fragmenting every file across multiple clouds, Fuze's allocation engine enforces **strict whole-file prioritization**:
* When a file is uploaded, the engine scans all active, unrevoked providers to see if **any single provider** has sufficient free space and supports the file size.
* If a fit exists, the file is designated strategy `"whole"`, weighted by provider speed:
  $$\text{Google Drive (100)} > \text{pCloud (95)} > \text{OneDrive (90)} > \text{Box (85)} > \text{Dropbox (70)}$$
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

---

## 4. Supported Cloud Providers

| Provider | Free Tier | Single-File Limit | Native Previews | Upload API Protocol |
| :--- | :---: | :---: | :---: | :--- |
| **Google Drive** | **15 GB** | 5 TB | Images, Videos, PDFs, Docs | Google Resumable Upload Session |
| **Box** | **10 GB** | 250 MB | 120+ Formats (Images, Office, Code) | Box Chunked Upload API |
| **pCloud** | **10 GB** | 10 GB | Images, Videos, PDFs, Audio | pCloud Direct REST Multipart (EU & US) |
| **Microsoft OneDrive** | **5 GB** | 250 GB | Images, Videos, Office 365 Previews | Graph API Resumable Upload Session |
| **Dropbox** | **2 GB** | 150 MB | Images, Videos, Docs | Dropbox Upload Sessions v2 |
| **Total Unified Pool** | **42 GB** | — | **Universal** | **Direct Browser-to-Cloud Zero Transit** |

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
│   │   │   ├── onedrive.adapter.ts # Microsoft Graph Integration
│   │   │   ├── pcloud.adapter.ts   # pCloud REST Integration
│   │   │   └── factory.ts          # Adapter Factory
│   │   ├── db/                     # Drizzle ORM Schema & Migrations
│   │   │   └── schema.ts           # PostgreSQL Table Definitions
│   │   ├── routes/                 # REST Route Handlers
│   │   │   ├── auth.routes.ts      # Auth, Sessions & Account Deletion
│   │   │   ├── files.routes.ts     # VFS File Operations & Thumbnails
│   │   │   ├── providers.routes.ts # OAuth Connect, Sync & Collision Check
│   │   │   └── upload.routes.ts    # Resumable Upload Sessions
│   │   ├── services/               # Core Business Logic
│   │   │   ├── chunk-decision.service.ts # Whole-File Priority & Chunking Engine
│   │   │   ├── thumbnail-cache.service.ts# Atomic LRU Thumbnail Disk Cache
│   │   │   ├── token.service.ts    # Token Refresh with Distributed Locking
│   │   │   ├── upload-session.service.ts # Upload Session Lifecycle
│   │   │   └── vfs.service.ts      # Virtual File System Tree Engine
│   │   ├── websocket/              # Real-Time Event Broadcasting
│   │   ├── workers/                # BullMQ Background Job Workers
│   │   └── index.ts                # Application Entrypoint & Server Setup
│   ├── package.json
│   └── tsconfig.json
│
├── web/                            # Next.js 16 Web Dashboard
│   ├── src/
│   │   ├── app/                    # App Router Pages
│   │   │   ├── (auth)/             # Login, Register, Verify Email
│   │   │   ├── dashboard/          # Drive Explorer, Storage, Settings, Trash
│   │   │   ├── layout.tsx          # Root Layout & SEO Schema.org Generators
│   │   │   ├── page.tsx            # High-Conversion Landing Page & Calculator
│   │   │   ├── robots.ts           # Dynamic robots.txt
│   │   │   └── sitemap.ts          # Dynamic sitemap.xml
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── brand/              # Fuze Vector Logos & Assets
│   │   │   └── drive/              # DriveView, Sidebar, Modals, Lightbox
│   │   ├── lib/                    # Client Upload Queue & WebSocket Clients
│   │   └── stores/                 # Zustand Global State Stores
│   ├── package.json
│   └── tsconfig.json
│
├── ARCHITECTURE.md                 # Deep Technical Architecture Documentation
├── LICENSE                         # MIT License
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
* **Node.js**: v20.x or higher
* **PostgreSQL**: v15.x or higher
* **Redis**: v7.x or higher

### Environment Variables

#### 1. Server Configuration (`server/.env`)
```bash
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
ENCRYPTION_KEY=32_byte_hex_string_for_aes_256_gcm_token_encryption

DATABASE_URL=postgresql://postgres:password@localhost:5432/fuze
REDIS_URL=redis://localhost:6379

# Google Drive OAuth (Credentials from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
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

# pCloud OAuth (pCloud App Portal)
PCLOUD_CLIENT_ID=your_pcloud_client_id
PCLOUD_CLIENT_SECRET=your_pcloud_client_secret
PCLOUD_REDIRECT_URI=http://localhost:4000/providers/pcloud/callback
```

#### 2. Web Configuration (`web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation & Startup

```bash
# 1. Clone the repository
git clone https://github.com/CodeItAftab/fuze.git
cd fuze

# 2. Install dependencies
cd server && npm install
cd ../web && npm install

# 3. Push Database Schema
cd ../server
npx drizzle-kit push

# 4. Start Development Servers
# Terminal 1: Backend API
cd server
npm run dev

# Terminal 2: Web Dashboard
cd web
npm run dev
```

Visit `http://localhost:3000` to launch your local Fuze dashboard.

---

## 8. Production Deployment Guide

Fuze is designed for **zero-cost, 24/7 deployment** with no credit card required:

1. **Frontend (`web`)**:
   * Deploy to **Vercel** (Hobby plan, 100% free forever).
   * Set custom domain to `fuze.aftabalam.me`.
   * Configure environment variables:
     * `NEXT_PUBLIC_API_URL=https://api.fuze.aftabalam.me`
     * `NEXT_PUBLIC_WS_URL=wss://api.fuze.aftabalam.me`
     * `NEXT_PUBLIC_APP_URL=https://fuze.aftabalam.me`
2. **Backend (`server`)**:
   * Deploy to **Render** (Free Web Service) or a container host.
   * Add a free keep-alive monitor via [cron-job.org](https://cron-job.org) hitting `/health` every 10 minutes to prevent sleeping.
3. **Database**:
   * Deploy to **Supabase** or **Neon** (Free 500 MB PostgreSQL).
4. **Cache & Queue**:
   * Deploy to **Upstash** (Free 10,000 commands/day serverless Redis).

---

## 9. Contributing & Roadmap

We welcome contributions from developers worldwide! 

### How to Contribute:
1. **Fork** the repository.
2. **Create a branch** for your feature (`git checkout -b feature/mega-adapter`).
3. **Commit** your changes (`git commit -m 'Add Mega storage adapter'`).
4. **Push** to your branch (`git push origin feature/mega-adapter`).
5. Open a **Pull Request**.

### Roadmap:
- [ ] Client-side zero-knowledge encryption using WebCrypto AES-GCM
- [ ] Desktop background sync daemon (TypeScript CLI)
- [ ] Additional storage adapters (Mega, Proton Drive, Nextcloud, WebDAV, AWS S3)
- [ ] Automated end-to-end integration test suite with GitHub Actions CI

---

## 10. License & Author

* **Created & Maintained by**: [Aftab Alam](https://aftabalam.me) ([@CodeItAftab](https://github.com/CodeItAftab))
* **License**: Released under the permissive **[MIT License](LICENSE)**.
