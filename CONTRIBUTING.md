# Contributing to Fuze Drive ⚡📁

Thank you for your interest in contributing to **Fuze Drive**! As an open-source personal cloud storage aggregator, Fuze thrives on contributions from the developer community.

---

## 🛠️ Tech Stack Overview

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Zustand, Lucide Icons.
- **Backend**: Fastify 5, TypeScript, Drizzle ORM, PostgreSQL, Redis (Redlock & Caching), BullMQ.
- **Architecture**: Direct-to-cloud zero-proxy streaming. The server orchestrates metadata, folder trees, and thumbnail caching, while raw file bytes stream directly between the client browser and cloud REST APIs.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v20.x or higher
- **PostgreSQL** 16+ (or Supabase/Neon connection string)
- **Redis** 7+ (or Upstash connection string)
- **npm** or **pnpm**

### 2. Fork & Clone
```bash
git clone https://github.com/<your-username>/fuze.git
cd fuze
```

### 3. Setting Up the Backend (`server/`)
```bash
cd server
cp .env.example .env # Fill in your DB and OAuth credentials
npm install
npm run db:push      # Push schema to local or development DB
npm run dev          # Starts Fastify on port 5000
```

### 4. Setting Up the Frontend (`web/`)
```bash
cd ../web
cp .env.example .env.local
npm install
npm run dev          # Starts Next.js on port 3000
```

---

## 🔌 Adding a New Cloud Storage Adapter

One of the highest-impact ways to contribute is implementing support for new free cloud providers (e.g. Mega, MediaFire, Proton Drive, IceDrive, Yandex Disk, Cloudflare R2, MinIO, Nextcloud).

1. Open `server/src/adapters/base.adapter.ts` and inspect the `StorageAdapter` interface.
2. Implement your new adapter in `server/src/adapters/<provider>.adapter.ts`.
3. Register the adapter in `server/src/adapters/factory.ts`.
4. Ensure the adapter supports direct client-to-cloud upload sessions (resumable URLs or presigned endpoints) so raw bytes never bottleneck the server.
5. Provide native thumbnail extraction if the provider supports image/document previews.

---

## 📋 Git Workflow & Guidelines

1. **Create a Topic Branch**:
   ```bash
   git checkout -b feature/mega-adapter
   # or
   git checkout -b fix/upload-progress-bar
   ```

2. **Commit Messages**:
   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(adapter): add Mega.nz storage provider`
   - `fix(upload): resolve chunk hash verification timeout`
   - `docs(readme): clarify Dropbox session upload limits`
   - `style(ui): improve responsive layout on mobile drive view`

3. **Verify Locally Before Submitting**:
   - Backend: `cd server && npm run build`
   - Frontend: `cd web && npm run build`
   - Ensure there are no TypeScript errors or broken imports.

4. **Submit a Pull Request**:
   - Push your branch to your fork.
   - Open a PR against `main` on `CodeItAftab/fuze`.
   - Provide a clear summary of your changes, screenshots for UI changes, and testing steps.

---

## 💬 Community & Questions

If you have questions, ideas, or feature requests:
- Open a [GitHub Issue](https://github.com/CodeItAftab/fuze/issues).
- Check existing issues with the `good first issue` label.
- Email support/maintainer: `support@fuzedrive.tech` or `codeitaftab@gmail.com`.
