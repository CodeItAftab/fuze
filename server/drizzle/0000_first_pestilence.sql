CREATE TYPE "public"."chunk_status" AS ENUM('pending', 'uploading', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."cloud_provider" AS ENUM('google_drive', 'dropbox', 'one_drive', 'pcloud');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('file', 'folder');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('pending', 'uploading', 'completed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."upload_strategy" AS ENUM('whole', 'chunked');--> statement-breakpoint
CREATE TABLE "file_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vfs_node_id" uuid NOT NULL,
	"provider_identity_id" uuid NOT NULL,
	"provider_file_id" text NOT NULL,
	"byte_start" bigint NOT NULL,
	"byte_end" bigint NOT NULL,
	"chunk_hash" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "cloud_provider" NOT NULL,
	"account_email" text,
	"encrypted_tokens" text NOT NULL,
	"token_expires_at" timestamp with time zone,
	"quota_total" bigint DEFAULT 0 NOT NULL,
	"quota_used" bigint DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vfs_node_id" uuid NOT NULL,
	"token" text NOT NULL,
	"password_hash" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "upload_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_session_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"byte_start" bigint NOT NULL,
	"byte_end" bigint NOT NULL,
	"provider_identity_id" uuid NOT NULL,
	"provider_session_url" text,
	"provider_file_id" text,
	"chunk_hash" text,
	"status" "chunk_status" DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"total_size" bigint NOT NULL,
	"strategy" "upload_strategy" NOT NULL,
	"merkle_root" text,
	"status" "session_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vfs_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"type" "node_type" NOT NULL,
	"size" bigint DEFAULT 0 NOT NULL,
	"mime_type" text,
	"merkle_root" text,
	"starred" boolean DEFAULT false NOT NULL,
	"trashed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file_chunks" ADD CONSTRAINT "file_chunks_vfs_node_id_vfs_nodes_id_fk" FOREIGN KEY ("vfs_node_id") REFERENCES "public"."vfs_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_chunks" ADD CONSTRAINT "file_chunks_provider_identity_id_provider_identities_id_fk" FOREIGN KEY ("provider_identity_id") REFERENCES "public"."provider_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_identities" ADD CONSTRAINT "provider_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_vfs_node_id_vfs_nodes_id_fk" FOREIGN KEY ("vfs_node_id") REFERENCES "public"."vfs_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_chunks" ADD CONSTRAINT "upload_chunks_upload_session_id_upload_sessions_id_fk" FOREIGN KEY ("upload_session_id") REFERENCES "public"."upload_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_chunks" ADD CONSTRAINT "upload_chunks_provider_identity_id_provider_identities_id_fk" FOREIGN KEY ("provider_identity_id") REFERENCES "public"."provider_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vfs_nodes" ADD CONSTRAINT "vfs_nodes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_chunk_session_idx" ON "upload_chunks" USING btree ("upload_session_id","chunk_index");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "user_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "vfs_user_parent_idx" ON "vfs_nodes" USING btree ("user_id","parent_id");--> statement-breakpoint
CREATE INDEX "vfs_trashed_idx" ON "vfs_nodes" USING btree ("user_id","trashed_at");