# Fuze Architecture & Technical Specification 🏗️

> **Comprehensive architectural blueprint for Fuze** — the zero-proxy, decentralized multi-cloud storage aggregator that pools free tiers across Google Drive, Box, pCloud, OneDrive, and Dropbox into a unified virtual filesystem.

---

## Table of Contents

1. [Architectural Philosophy](#1-architectural-philosophy)
   - [Separation of Control Plane & Data Plane](#separation-of-control-plane--data-plane)
   - [Zero-Proxy Architecture](#zero-proxy-architecture)
2. [Virtual File System (VFS) Tree Architecture](#2-virtual-file-system-vfs-tree-architecture)
   - [Hierarchical Node Model](#hierarchical-node-model)
   - [Parent Traversal & Path Invariant Checking](#parent-traversal--path-invariant-checking)
   - [Soft Deletes, Trash Lifecycle & Restoration](#soft-deletes-trash-lifecycle--restoration)
3. [Storage Allocation & Chunk Decision Engine](#3-storage-allocation--chunk-decision-engine)
   - [Rule 1: Whole-File High-Speed Priority](#rule-1-whole-file-high-speed-priority)
   - [Rule 2: Dynamic Multi-Cloud Chunking Fallback](#rule-2-dynamic-multi-cloud-chunking-fallback)
   - [Provider Selection & Quota Balancing Algorithm](#provider-selection--quota-balancing-algorithm)
   - [Dynamic Chunk Sizing Matrix](#dynamic-chunk-sizing-matrix)
4. [Data Plane: Zero-Proxy Upload & Download Protocol](#4-data-plane-zero-proxy-upload--download-protocol)
   - [Direct Upload Handshake Sequence](#direct-upload-handshake-sequence)
   - [Provider-Specific Resumable Protocol Implementations](#provider-specific-resumable-protocol-implementations)
   - [Zero-Proxy Download & Stream Assembly](#zero-proxy-download--stream-assembly)
5. [Data Integrity & Merkle Tree Verification](#5-data-integrity--merkle-tree-verification)
   - [Chunk Hash Computation](#chunk-hash-computation)
   - [Root Merkle Checksum Computation](#root-merkle-checksum-computation)
   - [Silent Data Corruption Detection](#silent-data-corruption-detection)
6. [Distributed Concurrency & Token Lifecycle](#6-distributed-concurrency--token-lifecycle)
   - [The Distributed Refresh Race Condition](#the-distributed-refresh-race-condition)
   - [Distributed Redis Mutex Locking](#distributed-redis-mutex-locking)
   - [AES-256-GCM Credential Encryption](#aes-256-gcm-credential-encryption)
7. [Cross-Provider Native Thumbnail Engine](#7-cross-provider-native-thumbnail-engine)
   - [Tier 1: Cloud-Native Presigned Previews](#tier-1-cloud-native-presigned-previews)
   - [Tier 2: On-Demand LRU Thumbnail Disk Cache](#tier-2-on-demand-lru-thumbnail-disk-cache)
8. [Real-Time WebSocket Synchronization](#8-real-time-websocket-synchronization)
   - [Connection Lifecycle & Heartbeats](#connection-lifecycle--heartbeats)
   - [Event Distribution Protocol](#event-distribution-protocol)
9. [Security, Privacy & Collision Protection](#9-security-privacy--collision-protection)
   - [Cross-User Account Collision Protection](#cross-user-account-collision-protection)
   - [Selective Cloud Purge on Account Deletion](#selective-cloud-purge-on-account-deletion)
   - [Revocation & Invalidation Protocol](#revocation--invalidation-protocol)
10. [Production Deployment Topology](#10-production-deployment-topology)
    - [Microservices & Cloud Edge Architecture](#microservices--cloud-edge-architecture)
    - [Zero-Cost High-Availability Stack](#zero-cost-high-availability-stack)

---

## 1. Architectural Philosophy

### Separation of Control Plane & Data Plane

Fuze divides all storage operations strictly into two decoupled systems:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CONTROL PLANE                             │
│  Fastify API Server • PostgreSQL (Drizzle ORM) • Redis Lock & Cache   │
│  - Authentication & Session Verification                               │
│  - Virtual File System Tree (Nodes, Folders, Paths, Quota accounting)  │
│  - Storage Provider Allocation & Presigned Upload Session Generation   │
│  - File Finalization, Hash Verification, and WebSocket Broadcasts      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Coordinates metadata only (KB/s)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                               DATA PLANE                               │
│            Client Browser (Next.js 16) ◄════════════► Cloud Providers  │
│                     (100% Direct Bandwidth Streaming)                  │
│  - High-speed direct HTTP PUT / POST binary uploads                    │
│  - Browser-side SHA-256 Merkle chunk hashing via Web Crypto API        │
│  - Parallel chunk download and multi-stream reconstruction             │
└────────────────────────────────────────────────────────────────────────┘
```

### Zero-Proxy Architecture

In traditional multi-cloud aggregators, the client uploads entire gigabyte files to an application server, which buffers the payload in RAM or temporary disk before uploading it to Google Drive or Dropbox.

**Problems with Traditional Proxying:**
1. **Bandwidth Costs**: Double bandwidth egress (Client → Server → Provider).
2. **Latency Penalty**: Network latency is doubled; uploads take twice as long.
3. **RAM & Disk Bottlenecks**: Servers crash or exhaust disk when handling concurrent multi-gigabyte uploads.
4. **Privacy Exposure**: User data is decrypted in memory on intermediary third-party infrastructure.

**The Fuze Zero-Proxy Solution:**
The Fuze server **never receives raw file bytes**. When a user uploads a 10 GB file:
1. The client requests an upload plan from the Fuze control plane (`POST /api/files/upload/initiate`).
2. The Fuze server calculates provider allocations, communicates with the provider APIs using OAuth2 tokens to create a **resumable upload session**, and returns direct upload URLs to the browser.
3. The browser uploads binary chunks directly to Google Drive, Box, pCloud, OneDrive, or Dropbox servers over HTTPS.
4. The browser notifies the Fuze server upon completion (`POST /api/files/upload/finalize`) with cryptographic hashes and provider object IDs.

---

## 2. Virtual File System (VFS) Tree Architecture

### Hierarchical Node Model

Fuze abstracts multi-cloud storage into an internal Virtual File System modeled after POSIX filesystem semantics. The VFS tree is persisted in PostgreSQL using Drizzle ORM.

```
                    ┌─────────────────────────┐
                    │      Virtual Root       │
                    │   (parentId = NULL)     │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌──────────────────────┐                    ┌──────────────────────┐
│  Folder: "Projects"  │                    │  Folder: "Documents" │
│  (type: 'folder')    │                    │  (type: 'folder')    │
└──────────┬───────────┘                    └──────────┬───────────┘
           │                                           │
     ┌─────┴─────────────┐                             ▼
     ▼                   ▼                  ┌──────────────────────┐
┌──────────────┐   ┌──────────────┐         │ File: "resume.pdf"   │
│ File: a.png  │   │ Subfolder:   │         │ (Whole-file: Drive)  │
│ (Whole-file: │   │ "v1.0"       │         └──────────────────────┘
│  Dropbox)    │   └──────────────┘
└──────────────┘
```

#### Core Database Schema Entities (`server/src/db/schema.ts`):

1. **`users`**: Base identity (Google OAuth2 profile, email, storage quota overrides).
2. **`providerIdentities`**: Linked third-party cloud accounts (Google Drive, Box, pCloud, OneDrive, Dropbox) storing AES-256-GCM encrypted tokens, account emails, and available free quota bytes.
3. **`files`**: Represents files and folders in the VFS:
   - `id`: UUID primary key.
   - `userId`: Owner reference.
   - `parentId`: UUID pointing to parent folder (`null` for top-level root).
   - `name`: Sanitized filename or directory name.
   - `type`: `'file' | 'folder'`.
   - `size`: Total file size in bytes (0 for folders).
   - `mimeType`: Detected MIME type.
   - `isDeleted`: Boolean flag for trash lifecycle.
   - `deletedAt`: Timestamp of soft deletion.
   - `merkleRoot`: SHA-256 Merkle root hash for data integrity.
4. **`fileChunks`**: Physical chunk allocations distributed across cloud providers:
   - `fileId`: Foreign key to `files.id`.
   - `providerId`: Cloud provider enum (`'gdrive' | 'onedrive' | 'dropbox' | 'box' | 'pcloud'`).
   - `chunkIndex`: Sequence number (0-indexed).
   - `size`: Byte count of this specific segment.
   - `checksum`: SHA-256 hex digest of this segment's raw bytes.
   - `remoteFileId`: Native file or object ID assigned by the remote cloud provider.

### Parent Traversal & Path Invariant Checking

To prevent directory traversal exploits, circular directory nesting, and orphan nodes:
- When moving a folder $F$ to target folder $T$, the control plane executes recursive CTE traversal to ensure $T \neq F$ and $T$ is not a descendant of $F$.
- Unique constraint: `UNIQUE (user_id, parent_id, name)` among non-deleted files guarantees no two sibling items can have the same name.

### Soft Deletes, Trash Lifecycle & Restoration

Fuze implements a two-stage deletion lifecycle:
1. **Soft Delete (`isDeleted = true`)**:
   - Marking a file as deleted immediately hides it from the standard drive view and updates user quota accounting.
   - Deleting a folder recursively soft-deletes all descendant files and subdirectories.
2. **Restoration**:
   - Restoring a file checks whether the parent folder still exists. If the parent was permanently purged, the file is safely moved to the user's root folder (`parentId = null`).
3. **Permanent Purge**:
   - Control plane queries all `fileChunks` associated with the target file(s).
   - The server triggers parallel `deleteFile(remoteFileId)` calls against the respective cloud provider APIs.
   - Upon remote confirmation, records are permanently purged via `CASCADE` delete in PostgreSQL.

---

## 3. Storage Allocation & Chunk Decision Engine

The **Chunk Decision Engine** (`server/src/services/chunk-decision.service.ts`) governs how incoming files are assigned to connected cloud accounts.

```
                      [ Incoming File (Size: S) ]
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Can any connected provider   │
                   │ hold the entire file S?      │
                   └───────────────┬───────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ YES                         │ NO
                    ▼                             ▼
        ┌───────────────────────┐    ┌──────────────────────────┐
        │        RULE 1         │    │          RULE 2          │
        │   Whole-File Mode     │    │  Multi-Cloud Chunking    │
        │                       │    │                          │
        │ Direct upload to the  │    │ Split into N chunks and  │
        │ single best provider  │    │ stripe across multiple   │
        │ (no chunking)         │    │ providers                │
        └───────────────────────┘    └──────────────────────────┘
```

### Rule 1: Whole-File High-Speed Priority

Whenever any single connected cloud provider has enough remaining quota to store the incoming file in its entirety:
1. **Zero Fragmentation**: The file is stored intact as a single remote object.
2. **Native Performance**: Eliminates chunking overhead, enables direct streaming, and preserves native provider thumbnails.
3. **Selection Metric**: The provider with the largest available free quota is selected to prevent localized capacity starvation.

### Rule 2: Dynamic Multi-Cloud Chunking Fallback

When a file exceeds the remaining capacity of any single provider, but the **aggregate remaining capacity** across all connected providers is sufficient:
1. The engine calculates an optimal chunk size dynamically based on file size and provider limits.
2. Chunks are allocated sequentially across providers in descending order of remaining quota.
3. Chunks are uploaded concurrently by the browser to multiple cloud endpoints in parallel.

### Dynamic Chunk Sizing Matrix

To balance parallel throughput against HTTP request overhead, chunk sizes are dynamically sized:

| File Size Range | Chunk Size | Max Concurrency | Rationale |
| :--- | :--- | :--- | :--- |
| **< 10 MB** | Whole file (No chunking) | 1 | Overhead of chunking outweighs benefits |
| **10 MB – 100 MB** | 10 MB | 3 parallel streams | Fast multi-cloud saturation |
| **100 MB – 1 GB** | 25 MB | 4 parallel streams | Optimizes TCP window without hitting timeouts |
| **> 1 GB** | 50 MB | 4 parallel streams | Maximizes provider throughput limits |

---

## 4. Data Plane: Zero-Proxy Upload & Download Protocol

### Direct Upload Handshake Sequence

```
Client (Browser)                  Fuze Server                    Cloud Provider (e.g. Drive)
       │                               │                                      │
       │ 1. POST /upload/initiate      │                                      │
       │    { name, size, mimeType }   │                                      │
       ├──────────────────────────────►│                                      │
       │                               │ 2. Evaluate Rule 1 & Select Provider │
       │                               │    Request Resumable Session         │
       │                               ├─────────────────────────────────────►│
       │                               │                                      │
       │                               │ 3. Return Session URI                │
       │                               │◄─────────────────────────────────────┤
       │ 4. Return Direct Session Plan │                                      │
       │    { uploadUrl, providerId }  │                                      │
       │◄──────────────────────────────┤                                      │
       │                                                                      │
       │ 5. Direct HTTP PUT / POST (Binary Stream + Content-Range)            │
       ├═════════════════════════════════════════════════════════════════════►│
       │                                                                      │
       │ 6. 200/201 OK { remoteFileId, etag }                                 │
       │◄═════════════════════════════════════════════════════════════════════┤
       │                               │                                      │
       │ 7. POST /upload/finalize      │                                      │
       │    { fileId, remoteFileId,    │                                      │
       │      merkleRoot, chunks }     │                                      │
       ├──────────────────────────────►│                                      │
       │                               │ 8. Verify hashes & commit to DB      │
       │                               │    Broadcast WebSocket event         │
       │ 9. 200 OK (File Active)       │                                      │
       │◄──────────────────────────────┤                                      │
```

### Provider-Specific Resumable Protocol Implementations

Each cloud provider uses a specialized protocol adapter (`server/src/adapters/`):

1. **Google Drive Adapter (`gdrive.adapter.ts`)**:
   - Initiates resumable session via `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`.
   - Returns unique `resumable_upload_url`.
   - Client performs direct `PUT` with `Content-Range: bytes 0-(size-1)/size`.
2. **Microsoft OneDrive Adapter (`onedrive.adapter.ts`)**:
   - Creates upload session via `POST /me/drive/root:/Fuze/{name}:/createUploadSession`.
   - Client sends chunked `PUT` requests to the generated Microsoft upload URL.
3. **Dropbox Adapter (`dropbox.adapter.ts`)**:
   - For small files: Direct upload via `https://content.dropboxapi.com/2/files/upload`.
   - For chunked files: Initiates session via `upload_session/start`, streams segments via `upload_session/append_v2`, and closes with `upload_session/finish`.
4. **Box Adapter (`box.adapter.ts`)**:
   - Creates chunked upload session via `POST https://upload.box.com/api/2.0/files/upload_sessions`.
   - Returns session ID and chunk endpoints.
5. **pCloud Adapter (`pcloud.adapter.ts`)**:
   - Calls `getuploadserver` to acquire optimal regional endpoint IP.
   - Uploads binary payload directly via `uploadfile` endpoint with authentication tokens.

### Zero-Proxy Download & Stream Assembly

1. **Whole-File Downloads (Rule 1)**:
   - Control plane requests a temporary presigned download redirect URL from the provider adapter.
   - Browser client receives an HTTP 302 redirect directly to the cloud provider's high-speed CDN.
   - Direct download with zero server transit.
2. **Chunked File Downloads (Rule 2)**:
   - Client requests presigned download links for each chunk: `GET /api/files/:id/download-plan`.
   - Client issues parallel range-based HTTP `fetch()` requests directly to the cloud providers.
   - Browser assembles the chunks sequentially in memory using the **Streams API** (`ReadableStream`) or concatenates `Blob` instances before triggering a native file save dialog.

---

## 5. Data Integrity & Merkle Tree Verification

To ensure that distributed multi-cloud transfers suffer zero data corruption:

```
                          [ File: 100 MB ]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
          [ Chunk 0: 50MB ]               [ Chunk 1: 50MB ]
                 │                               │
                 ▼ (SHA-256)                     ▼ (SHA-256)
             Hash H_0                        Hash H_1
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                                 ▼ SHA-256(H_0 || H_1)
                         [ Merkle Root Hash ]
```

### Chunk Hash Computation
As the browser reads each file slice via `FileReader` / `crypto.subtle.digest('SHA-256', buffer)`:
$$\text{ChunkHash}_i = \text{SHA256}(\text{ChunkData}_i)$$

### Root Merkle Checksum Computation
When all chunks complete uploading, the overall file integrity is verified by hashing concatenated chunk digests:
$$\text{MerkleRoot} = \text{SHA256}(\text{ChunkHash}_0 \mathbin{\Vert} \text{ChunkHash}_1 \mathbin{\Vert} \dots \mathbin{\Vert} \text{ChunkHash}_{N-1})$$

### Silent Data Corruption Detection
1. The client sends `merkleRoot` and each individual `checksum` to `POST /api/files/upload/finalize`.
2. The control plane validates that the submitted `checksum` list matches the reported byte sizes and computes the root verification hash before committing the file to active status.
3. On download, the browser re-hashes downloaded chunks and compares them to the recorded database checksums. Any tampered or corrupted chunk triggers an automatic re-fetch.

---

## 6. Distributed Concurrency & Token Lifecycle

### The Distributed Refresh Race Condition

In high-concurrency environments, multiple chunk uploads or file listing requests may occur simultaneously when an OAuth2 access token expires. Without synchronization:
- Request A triggers a token refresh with the provider.
- Request B triggers a token refresh concurrently with the same refresh token.
- Many OAuth2 providers (especially Google and OneDrive) invalidate the old refresh token upon rotation, causing Request B to fail with `invalid_grant` and permanently disconnecting the user's account.

### Distributed Redis Mutex Locking

Fuze implements a distributed mutex around token refresh operations (`server/src/adapters/base.adapter.ts`):

```typescript
const lockKey = `lock:token:refresh:${providerIdentityId}`;
const acquired = await redis.set(lockKey, workerId, 'PX', 10000, 'NX');

if (!acquired) {
  // Wait and poll until the holding process completes the refresh
  return await waitForTokenRefresh(providerIdentityId);
}

try {
  // Execute provider token refresh and update DB
} finally {
  // Release lock safely via Lua script (ensures only the lock owner deletes it)
  await redis.eval(RELEASE_LOCK_LUA, 1, lockKey, workerId);
}
```

### AES-256-GCM Credential Encryption

All sensitive OAuth2 credentials (`accessToken`, `refreshToken`) are encrypted before database insertion using AES-256-GCM:
- 12-byte cryptographically secure random initialization vector (IV).
- 16-byte authentication tag prevents ciphertext tampering.
- Encryption key derived from server environment secret `ENCRYPTION_SECRET`.

---

## 7. Cross-Provider Native Thumbnail Engine

Image and document previews are critical for user experience, but downloading full multi-megabyte images through the server to generate thumbnails degrades performance.

### Tier 1: Cloud-Native Presigned Previews

Each provider maintains internal thumbnailing pipelines. Fuze extracts and leverages these native endpoints:
- **Google Drive**: `thumbnailLink` property returned from files API (provides fast, scaled image URLs).
- **OneDrive**: `/thumbnails/0/large/url` API.
- **Dropbox**: `files/get_thumbnail_v2` direct link.
- **Box**: Native thumbnail representation URIs.

### Tier 2: On-Demand LRU Thumbnail Disk Cache

For formats not directly served by the provider, or when presigned links expire:
- The server provides `GET /api/files/:id/thumbnail` (`server/src/services/thumbnail-cache.service.ts`).
- Generates web-optimized image previews and caches them on disk in a managed LRU cache directory.
- Disk cache is bounded (maximum 500 MB) with automatic eviction of the least recently used thumbnails when capacity thresholds are reached.

---

## 8. Real-Time WebSocket Synchronization

Fuze provides real-time state synchronization across all open browser tabs and devices via Fastify WebSocket (`@fastify/websocket`).

```
Browser Tab 1 (Desktop)          Browser Tab 2 (Mobile)          Fuze Server (Fastify WS)
       │                                │                                    │
       ├─ WS Connect ───────────────────┼───────────────────────────────────►│ (Register User Channel)
       │                                ├─ WS Connect ──────────────────────►│ (Register User Channel)
       │                                │                                    │
       │ ── Upload Completed ───────────┼───────────────────────────────────►│
       │                                │                                    │
       │                                │ ◄── Broadcast: FILE_UPLOADED ──────┤
       │ ◄── Broadcast: FILE_UPLOADED ──┼────────────────────────────────────┤
       │ (State auto-updates)           │ (State auto-updates)               │
```

### Supported Real-Time Events:
- `FILE_UPLOADED`: Ingests newly finalized file into the drive explorer.
- `FILE_DELETED`: Removes item from grid and moves it to trash view.
- `STORAGE_UPDATED`: Refreshes aggregated storage meters and breakdown.
- `PROVIDER_CONNECTED`: Re-evaluates connected cloud status and total capacity.
- `SESSION_REVOKED`: Forces immediate client logout on remote session destruction.

---

## 9. Security, Privacy & Collision Protection

### Cross-User Account Collision Protection

To prevent cross-user account hijacking or double-accounting of cloud drives:
- During OAuth2 callback handling (`server/src/routes/providers.routes.ts`), the server extracts the authenticated account email.
- The server checks if another user (`ne(providerIdentities.userId, currentUserId)`) has already linked this specific cloud account email.
- If a collision is detected, the OAuth handshake is aborted with `ACCOUNT_ALREADY_LINKED` and descriptive guidance is returned to the user.

### Selective Cloud Purge on Account Deletion

When a user deletes their account (`DELETE /api/auth/account`), Fuze provides user-controlled data handling:
- **Option A (Preserve Cloud Files)**: Purges all metadata, credentials, and session records from Fuze databases while leaving the user's files safely intact inside their Google Drive, OneDrive, Box, pCloud, and Dropbox accounts.
- **Option B (Wipe Remote Files)**: The server queries all `fileChunks` and executes parallel `deleteFile` API requests across all connected cloud providers before cascading database record removal.

---

## 10. Production Deployment Topology

### Microservices & Cloud Edge Architecture

```
                                  [ Internet / Clients ]
                                             │
                                             ▼
                               [ Cloudflare DNS & SSL ]
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
           [ Vercel Edge Network ]                       [ Render / Koyeb Web Service ]
        Frontend: Next.js 16 Web App                    Backend: Fastify Node.js API
          (https://fuze.aftabalam.me)                    (https://api.fuze.aftabalam.me)
                      │                                             │
                      │                                             ▼
                      │                               ┌───────────────────────────┐
                      │                               │  PostgreSQL Database      │
                      │                               │  (Supabase / Neon DB)     │
                      │                               ├───────────────────────────┤
                      │                               │  Upstash Redis            │
                      │                               │  (Locks, PubSub, Sessions)│
                      │                               └───────────────────────────┘
                      │                                             │
                      └═══════════════ Direct Data Plane ═══════════┘
                                             ▼
                      [ Google Drive • Box • pCloud • OneDrive • Dropbox ]
```

### Zero-Cost High-Availability Stack

Fuze is architected to run permanently within generous free-tier limits:

| Component | Recommended Provider | Free Tier Specification |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | 100 GB bandwidth/month, Global Edge Network, custom domains |
| **Backend API** | **Render / Koyeb** | Free web service, zero proxy bandwidth consumption |
| **Database** | **Supabase / Neon** | Free managed PostgreSQL (500 MB storage, connection pooling) |
| **Locking & Cache** | **Upstash** | 10,000 commands/day serverless Redis |
| **DNS & Security** | **Cloudflare** | Free DDoS protection, SSL termination, Edge Caching |
