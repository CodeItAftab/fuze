import {
  pgTable,
  text,
  timestamp,
  boolean,
  bigint,
  integer,
  uuid,
  pgEnum,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const cloudProviderEnum = pgEnum("cloud_provider", [
  "google_drive",
  "dropbox",
  "one_drive",
  "pcloud",
  "box",
]);
export const nodeTypeEnum = pgEnum("node_type", ["file", "folder"]);
export const uploadStrategyEnum = pgEnum("upload_strategy", [
  "whole",
  "chunked",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "pending",
  "uploading",
  "completed",
  "cancelled",
  "expired",
]);
export const chunkStatusEnum = pgEnum("chunk_status", [
  "pending",
  "uploading",
  "completed",
  "failed",
]);

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 2. User Sessions (Database-backed session invalidation & device management)
export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull().unique(),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("session_user_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ],
);

// 3. Connected Cloud Storage Providers
export const providerIdentities = pgTable("provider_identities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  provider: cloudProviderEnum("provider").notNull(),
  accountEmail: text("account_email"),
  encryptedAccessToken: text("encrypted_access_token").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at", {
    withTimezone: true,
  }).notNull(),
  quotaTotal: bigint("quota_total", { mode: "number" }).default(0).notNull(),
  quotaUsed: bigint("quota_used", { mode: "number" }).default(0).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 4. Virtual File System Nodes (Folders & Files)
export const vfsNodes = pgTable(
  "vfs_nodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => vfsNodes.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    type: nodeTypeEnum("type").notNull(),
    size: bigint("size", { mode: "number" }).default(0).notNull(),
    mimeType: text("mime_type"),
    merkleRoot: text("merkle_root"),
    starred: boolean("starred").default(false).notNull(),
    trashedAt: timestamp("trashed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vfs_user_parent_idx").on(table.userId, table.parentId),
    index("vfs_user_trash_idx").on(table.userId, table.trashedAt),
  ],
);

// 5. Stateful Resumable Upload Sessions
export const uploadSessions = pgTable("upload_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  parentId: uuid("parent_id").references(() => vfsNodes.id),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  totalSize: bigint("total_size", { mode: "number" }).notNull(),
  strategy: uploadStrategyEnum("strategy").notNull(),
  merkleRoot: text("merkle_root"),
  status: sessionStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 6. Resumable Upload Chunks (Per-chunk tracking)
export const uploadChunks = pgTable(
  "upload_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    uploadSessionId: uuid("upload_session_id")
      .references(() => uploadSessions.id, { onDelete: "cascade" })
      .notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    byteStart: bigint("byte_start", { mode: "number" }).notNull(),
    byteEnd: bigint("byte_end", { mode: "number" }).notNull(),
    providerIdentityId: uuid("provider_identity_id")
      .references(() => providerIdentities.id, { onDelete: "cascade" })
      .notNull(),
    providerSessionUrl: text("provider_session_url"),
    providerSessionExpiresAt: timestamp("provider_session_expires_at", {
      withTimezone: true,
    }),
    chunkHash: text("chunk_hash"),
    providerFileId: text("provider_file_id"),
    status: chunkStatusEnum("status").default("pending").notNull(),
    retryCount: integer("retry_count").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("upload_chunk_session_idx").on(
      table.uploadSessionId,
      table.chunkIndex,
    ),
  ],
);

// 7. Finalized File Chunks Mapping
export const fileChunks = pgTable(
  "file_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vfsNodeId: uuid("vfs_node_id")
      .references(() => vfsNodes.id, { onDelete: "cascade" })
      .notNull(),
    providerIdentityId: uuid("provider_identity_id")
      .references(() => providerIdentities.id)
      .notNull(),
    providerFileId: text("provider_file_id").notNull(),
    byteStart: bigint("byte_start", { mode: "number" }).notNull(),
    byteEnd: bigint("byte_end", { mode: "number" }).notNull(),
    chunkHash: text("chunk_hash").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("chunks_vfs_idx").on(table.vfsNodeId)],
);

// 8. Public Share Links
export const shares = pgTable("shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  vfsNodeId: uuid("vfs_node_id")
    .references(() => vfsNodes.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  passwordHash: text("password_hash"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
