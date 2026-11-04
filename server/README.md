# Fuze Drive Server ⚡⚙️

> **Fastify 5 Control Plane & Storage Orchestrator** for [Fuze Drive](https://fuzedrive.tech) — coordinates Virtual File System (VFS) trees, multi-cloud OAuth sessions, chunk allocation, distributed locking, and real-time state synchronization across **MEGA, Google Drive, Box, pCloud, Koofr, OneDrive, and Dropbox**.

---

## 🛠️ Tech Stack & Architecture

* **Runtime & Framework**: Node.js 20+ with [Fastify 5](https://fastify.dev)
* **Database & ORM**: PostgreSQL 16 with [Drizzle ORM](https://orm.drizzle.team)
* **Cache & Distributed Locks**: Redis (via `ioredis` with Redlock distributed mutexes)
* **Background Queue**: [BullMQ](https://bullmq.io) for async migration and reconciliation jobs
* **WebSockets**: Native Fastify WebSocket manager for instant multi-tab broadcasts
* **Security & Crypto**: AES-256-GCM encrypted provider credentials, signed HttpOnly cookies, and short-lived JWT stream tokens

---

## 🏗️ Core Backend Responsibilities

### 1. Control Plane vs. Data Plane Separation
The Fuze server acts strictly as a **control plane**:
* It provisions resumable direct upload sessions, stores metadata, and generates direct download links.
* **Zero Bandwidth Proxying**: Large file uploads and direct CDN downloads stream directly between the client browser and the storage providers.

### 2. Multi-Cloud Storage Adapters (`src/adapters/`)
All storage providers implement the unified `StorageAdapter` interface (`src/adapters/base.adapter.ts`):
1. **MEGA (`mega.adapter.ts`)**: Authenticates via user credentials encrypted at rest. Generates direct upload nodes with end-to-end encrypted storage keys (+20 GB free tier).
2. **Google Drive (`gdrive.adapter.ts`)**: Initiates Google Resumable Upload sessions (`drive.file` scope) with direct binary PUT endpoints (+15 GB free tier).
3. **Box (`box.adapter.ts`)**: Creates Box chunked upload sessions via Box 2.0 API. Issues direct CDN URLs (+10 GB free tier).
4. **pCloud (`pcloud.adapter.ts`)**: Allocates nearest regional EU/US upload server and issues direct multipart endpoints (+10 GB free tier).
5. **Koofr (`koofr.adapter.ts`)**: Connects via WebDAV protocol using dedicated Koofr App Passwords with automated credential sanitization (+10 GB free tier).
6. **Microsoft OneDrive (`onedrive.adapter.ts`)**: Provisions Microsoft Graph resumable upload sessions and Azure CDN direct links (+5 GB free tier).
7. **Dropbox (`dropbox.adapter.ts`)**: Initiates Dropbox Upload Sessions v2 and issues direct CDN links (+2 GB free tier).

### 3. Chunk Decision Engine (`src/services/chunk-decision.service.ts`)
* **Rule 1 (Whole-File Priority)**: Scans all active providers to see if any single cloud can hold the file intact. If so, stores it as a single object, weighted by provider priority:
  $$\text{MEGA (105)} > \text{Google Drive (100)} > \text{pCloud (95)} > \text{OneDrive (90)} > \text{Koofr (88)} > \text{Box (85)} > \text{Dropbox (70)}$$
* **Rule 2 (Dynamic Multi-Cloud Chunking)**: If no single provider has enough remaining space, the file is sliced into 10 MB–50 MB chunks and striped across available clouds.

### 4. Distributed Token Refresh Locking (Redis)
When parallel chunk transfers fire simultaneously on an expiring OAuth token, Fuze acquires a Redis distributed mutex (`SET lock:token:refresh:<id> EX 10 NX`) ensuring only a single process exchanges the refresh token with the provider, completely preventing OAuth `invalid_grant` race conditions.

### 5. Non-Destructive Reconnection & Identity Isolation
* Multi-account connection queries check active accounts (`is_disconnected = false AND is_revoked = false`).
* An account previously disconnected from one user can be connected to another without false collision errors.
* Reconnecting a provider triggers `reconcileReconnectedProvider` to verify physical file existence (`adapter.verifyFileExists`) and non-destructively restores access to existing VFS files.

### 6. Streaming & Media Acceleration
* **Direct CDN Redirects**: Issues HTTP 307 Temporary Redirects straight to cloud CDNs (`dl.dropboxusercontent.com`, Azure CDN, Akamai CDN, pCloud CDN) with **zero server bandwidth transit**.
* **Stream Tokens**: Issues signed 6-hour JWT stream tokens (`?token=...`) so HTML5 media players can stream authenticated files without cross-origin cookie blockers.
* **CORS Range Whitelisting**: Allows `Range` request header and exposes `Content-Range`, `Accept-Ranges`, and `Content-Length`.

---

## 📁 Server Directory Structure

```
server/
├── src/
│   ├── adapters/               # 7 Cloud storage adapters implementing StorageAdapter
│   │   ├── base.adapter.ts     # Core interface & verifyFileExists definition
│   │   ├── box.adapter.ts
│   │   ├── dropbox.adapter.ts
│   │   ├── gdrive.adapter.ts
│   │   ├── koofr.adapter.ts
│   │   ├── mega.adapter.ts
│   │   ├── onedrive.adapter.ts
│   │   ├── pcloud.adapter.ts
│   │   └── factory.ts          # Storage adapter factory
│   │
│   ├── db/
│   │   ├── schema.ts           # Drizzle ORM PostgreSQL schema
│   │   └── index.ts            # Database pool connection
│   │
│   ├── routes/
│   │   ├── auth.routes.ts      # Authentication, sessions & account deletion
│   │   ├── files.routes.ts     # VFS navigation, file downloads, direct streaming & thumbnails
│   │   ├── providers.routes.ts # OAuth handshakes, credentials & identity collision checks
│   │   └── uploads.routes.ts   # Resumable upload session provisioning & Merkle finalization
│   │
│   ├── services/
│   │   ├── cache.service.ts    # Redis cache & distributed locking
│   │   ├── chunk-decision.service.ts # Whole-file vs chunked allocation logic
│   │   ├── quota.service.ts    # Cloud quota refresh & capacity tracking
│   │   ├── thumbnail-cache.service.ts # Atomic LRU disk cache for previews
│   │   ├── token.service.ts    # AES-256-GCM token encryption & safe refresh
│   │   ├── upload-session.service.ts  # Upload session lifecycle
│   │   └── vfs.service.ts      # Virtual File System tree operations
│   │
│   ├── websocket/
│   │   └── index.ts            # Fastify WebSocket real-time event broadcaster
│   │
│   ├── workers/                # BullMQ background workers (migration & reconciliation)
│   └── index.ts                # Fastify server initialization & CORS configuration
│
├── package.json
└── tsconfig.json
```

---

## 🚀 Local Development Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment (`server/.env`)
```bash
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# Secrets
JWT_SECRET=your_32_char_jwt_secret
COOKIE_SECRET=your_32_char_cookie_secret
ENCRYPTION_KEY=your_64_char_hex_encryption_key

# Databases
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuze
REDIS_URL=redis://localhost:6379

# Cloud Provider OAuth Keys
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/providers/google/callback

MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_REDIRECT_URI=http://localhost:4000/providers/onedrive/callback

DROPBOX_CLIENT_ID=...
DROPBOX_CLIENT_SECRET=...
DROPBOX_REDIRECT_URI=http://localhost:4000/providers/dropbox/callback

BOX_CLIENT_ID=...
BOX_CLIENT_SECRET=...
BOX_REDIRECT_URI=http://localhost:4000/providers/box/callback

PCLOUD_CLIENT_ID=...
PCLOUD_CLIENT_SECRET=...
PCLOUD_REDIRECT_URI=http://localhost:4000/providers/pcloud/callback
```

### 3. Push Database Schema
```bash
npm run db:push
```

### 4. Start the Server
```bash
npm run dev
```

---

## 🚢 Production Deployment

The server runs on an **Oracle Cloud Infrastructure (OCI) ARM Ampere VM** (4 OCPU, 24 GB RAM):
* API Host: `https://api.fuzedrive.tech`
* Process Manager: **PM2** (`pm2 start dist/index.js --name fuze-api`)
* Reverse Proxy: **Caddy** (Automated HTTPS and WebSocket proxying)
* Database: **Neon Serverless PostgreSQL**
* Redis: **Upstash Serverless Redis**
