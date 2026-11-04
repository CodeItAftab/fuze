# Fuze Drive Web ⚡🌐

> **Client-Side Next.js 16 Web Dashboard & Marketing Platform** for [Fuze Drive](https://fuzedrive.tech) — the open-source personal cloud storage aggregator pooling up to 72 GB of free storage across **MEGA, Google Drive, Box, pCloud, Koofr, OneDrive, and Dropbox** with direct client-to-cloud transfers.

---

## 🛠️ Tech Stack & Tooling

* **Framework**: [Next.js 16](https://nextjs.org) with React 19 and [Turbopack](https://turbo.build/pack)
* **Styling**: [Tailwind CSS](https://tailwindcss.com) with custom glassmorphism and dark mode gradients
* **Icons**: [Lucide React](https://lucide.dev)
* **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Modular stores for VFS tree, upload queue, active previews)
* **Cryptography**: Web Crypto API (Client-side SHA-256 Merkle root hashing)
* **File Assembly Engine**: Custom zero-proxy streaming engine with concurrent parallel chunk fetching and in-memory `Blob` generation
* **TypeScript**: Strict type definitions for multi-provider schemas and VFS nodes

---

## 🏗️ Core Client-Side Architecture

### 1. Zero-Proxy Direct Uploads (`src/lib/upload-queue.ts`)
* When files are selected or dragged into the Drive Explorer, the client requests an upload plan from the Fastify control plane (`POST /files/upload/initiate`).
* For single-provider uploads (**Rule 1**) or multi-cloud chunked uploads (**Rule 2**), binary bytes stream **directly from the browser to cloud provider endpoints** over HTTPS.
* The application server never acts as a proxy or buffers file data in memory.
* As chunks upload, the browser computes SHA-256 chunk digests and builds the root Merkle tree client-side before calling `/files/upload/finalize`.

### 2. High-Speed Direct CDN Streaming & Client-Side In-Memory Assembly (`src/lib/download-engine.ts`)
* **Direct Cloud CDN Streaming**:
  * For whole files on providers supporting pre-authenticated links (**Dropbox**, **OneDrive**, **pCloud**, **Box**), requests redirect directly (HTTP 307) to the provider's global CDN endpoints (`dl.dropboxusercontent.com`, Microsoft Azure CDN, Box Akamai CDN, pCloud CDN).
  * Bytes stream directly to the browser with **0 MB server transit**.
* **Zero-Buffering In-Memory Assembly (`downloadAndAssembleChunks`)**:
  * For multi-cloud chunked media or files $\le 80$ MB, chunks are fetched in parallel across providers (concurrency 4) and assembled into a local `blob:` URL.
  * In HTML5 `<video>` and `<audio>` players, playback begins in 1–2 seconds with **zero buffering** and **instantaneous 0 ms seeking/scrubbing**.
* **CORS Compliance**:
  * Media tags (`<video>`, `<audio>`, `<img>`) omit `crossOrigin="use-credentials"`, eliminating browser credential wildcard CORS blocks against third-party storage CDNs.
  * Control plane issues 6-hour JWT stream tokens (`?token=...`), enabling seamless media streaming without cross-origin cookie blockers.

### 3. Universal File Preview Suite (`src/components/preview/`)
* **Video (`VideoPreview.tsx`)**: HTML5 native video player with automatic MIME resolution (`.mp4`, `.webm`, `.mov`, `.mkv`), inline controls, and fallback retry handling.
* **Audio (`AudioPreview.tsx`)**: Audio player with animated waveform cards and playback controls.
* **Images (`ImagePreview.tsx`)**: Fullscreen pan/zoom viewer with native provider thumbnails and canvas fallbacks.
* **Documents & Spreadsheets**:
  * **PDF (`PdfPreview.tsx`)**: Canvas-rendered pagination with zoom controls.
  * **DOCX (`DocxPreview.tsx`)**: Rich HTML rendering of Word documents.
  * **Excel / Spreadsheets (`ExcelPreview.tsx`)**: Interactive multi-sheet tabular grid viewer.
* **Text & Code (`CodePreview.tsx`)**: Syntax-highlighted code viewer supporting over 40 programming and configuration languages.
* **Markdown (`MarkdownPreview.tsx`)**: GFM-rendered markdown previewer.

---

## 📁 Project Directory Structure

```
web/
├── public/                     # Static assets, branding logos & favicons
├── src/
│   ├── app/                    # Next.js App Router (Pages & API routes)
│   │   ├── (auth)/             # Authentication pages (Login, Register, Forgot Password)
│   │   ├── compare/            # MultCloud vs Fuze Drive comparison page
│   │   ├── dashboard/          # Authenticated App Dashboard
│   │   │   ├── folders/        # Dynamic folder navigation view
│   │   │   ├── migrations/     # Cloud-to-cloud migration manager
│   │   │   ├── settings/       # Account, security & profile settings
│   │   │   ├── starred/        # Starred files view
│   │   │   ├── storage/        # Connected clouds & pool management
│   │   │   ├── trash/          # Soft-deleted files & restore actions
│   │   │   └── uploads/        # Active & completed upload queue history
│   │   ├── faq/                # SEO Structured FAQ & knowledge base
│   │   ├── guides/             # In-depth cloud storage guides
│   │   ├── how-it-works/       # Technical architecture walkthrough
│   │   ├── preview/[id]/       # Standalone full-page file preview route
│   │   ├── share/[token]/      # Public secure share link landing page
│   │   ├── layout.tsx          # Root layout & SEO JSON-LD injection
│   │   ├── page.tsx            # Landing page & 7-cloud storage pool calculator
│   │   └── sitemap.ts          # Dynamic sitemap generator
│   │
│   ├── components/
│   │   ├── brand/              # Fuze Drive logos & vector marks
│   │   ├── drive/              # FileGrid, FileList, Breadcrumbs, ActionBars, FilePreviewModal
│   │   ├── landing/            # Hero, Calculator, Mockup, Navbar, Footer
│   │   ├── preview/            # VideoPreview, AudioPreview, DocxPreview, ExcelPreview, etc.
│   │   ├── share/              # Public file share view & password unlocker
│   │   └── storage/            # CloudProviderCard, ConnectModal, DisconnectModal
│   │
│   ├── lib/
│   │   ├── download-engine.ts  # Zero-proxy file download & parallel chunk assembly
│   │   ├── upload-queue.ts     # Client upload orchestrator & resumable session runner
│   │   ├── facts.ts            # Single-source-of-truth for provider limits & quotas
│   │   └── utils.ts            # Byte formatting, mime resolvers, date helpers
│   │
│   └── stores/                 # Zustand global application state stores
│
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the `web/` directory:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🚢 Production Deployment

Fuze Web is optimized for deployment on **Vercel** with Next.js Turbopack:
* Production URL: [https://fuzedrive.tech](https://fuzedrive.tech)
* Environment variables configured in Vercel project settings:
  * `NEXT_PUBLIC_API_URL=https://api.fuzedrive.tech`
  * `NEXT_PUBLIC_WS_URL=wss://api.fuzedrive.tech`
  * `NEXT_PUBLIC_APP_URL=https://fuzedrive.tech`
