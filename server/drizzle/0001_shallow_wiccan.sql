ALTER TYPE "public"."cloud_provider" ADD VALUE 'box';--> statement-breakpoint
DROP INDEX "vfs_trashed_idx";--> statement-breakpoint
ALTER TABLE "provider_identities" ALTER COLUMN "token_expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_identities" ADD COLUMN "encrypted_access_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_identities" ADD COLUMN "encrypted_refresh_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_identities" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "upload_chunks" ADD COLUMN "provider_session_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_parent_id_vfs_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vfs_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vfs_nodes" ADD CONSTRAINT "vfs_nodes_parent_id_vfs_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vfs_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunks_vfs_idx" ON "file_chunks" USING btree ("vfs_node_id");--> statement-breakpoint
CREATE INDEX "vfs_user_trash_idx" ON "vfs_nodes" USING btree ("user_id","trashed_at");--> statement-breakpoint
ALTER TABLE "provider_identities" DROP COLUMN "encrypted_tokens";