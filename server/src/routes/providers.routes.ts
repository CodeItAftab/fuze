import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "node:crypto";
import {
  db,
  providerIdentities,
  fileChunks,
  uploadChunks,
  vfsNodes,
} from "../db/index.js";
import { eq, and, sql } from "drizzle-orm";
import { encrypt, decrypt } from "../utils/crypto.js";
import { getStorageAdapter, SupportedProvider } from "../adapters/factory.js";
import { socketManager } from "../websocket/socket-manager.js";
import { ProviderCleanupService } from "../services/provider-cleanup.service.js";
import { providerMigrationQueue } from "../workers/provider-migration.worker.js";
import IORedis from "ioredis";
import { TokenService } from "../services/token.service.js";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");
const COOKIE_NAME = "fuze_session";

export async function providerRoutes(fastify: FastifyInstance) {
  // -------------------------------------------------------------
  // 1. LIST CONNECTED PROVIDERS & STORAGE SUMMARY
  // -------------------------------------------------------------
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const user = request.user as { userId: string };

    const items = await db
      .select({
        id: providerIdentities.id,
        provider: providerIdentities.provider,
        accountEmail: providerIdentities.accountEmail,
        quotaTotal: providerIdentities.quotaTotal,
        quotaUsed: providerIdentities.quotaUsed,
        lastSyncedAt: providerIdentities.lastSyncedAt,
      })
      .from(providerIdentities)
      .where(eq(providerIdentities.userId, user.userId));

    // Also calculate actual active storage used by files in Fuze VFS
    const [vfsStats] = await db
      .select({
        totalSize: sql<string>`COALESCE(SUM(CASE WHEN ${vfsNodes.type} = 'file' AND ${vfsNodes.trashedAt} IS NULL THEN ${vfsNodes.size} ELSE 0 END), 0)`,
      })
      .from(vfsNodes)
      .where(eq(vfsNodes.userId, user.userId));

    const vfsUsedBytes = Number(vfsStats?.totalSize || 0);
    const totalPool = items.reduce((sum, p) => sum + p.quotaTotal, 0);
    const rawUsedPool = items.reduce((sum, p) => sum + p.quotaUsed, 0);
    const usedPool = Math.max(rawUsedPool, vfsUsedBytes);

    return reply.send({
      providers: items,
      summary: {
        totalPoolBytes: totalPool,
        usedPoolBytes: usedPool,
        freePoolBytes: Math.max(0, totalPool - usedPool),
      },
    });
  });

  // -------------------------------------------------------------
  // 2. OAUTH CONNECT REDIRECT (/providers/:provider/connect & /providers/:provider/auth)
  // -------------------------------------------------------------
  const handleOAuthConnect = async (
    request: FastifyRequest<{ Params: { provider: string } }>,
    reply: FastifyReply,
  ) => {
    let userId: string | undefined;
    const rawCookie = request.cookies[COOKIE_NAME];
    if (rawCookie) {
      const unsigned = request.unsignCookie(rawCookie);
      const token = unsigned.valid && unsigned.value ? unsigned.value : rawCookie;
      try {
        const decoded = fastify.jwt.verify<{ userId: string }>(token);
        userId = decoded.userId;
      } catch {}
    }

    if (!userId) {
      try {
        await request.jwtVerify();
        userId = (request.user as { userId: string })?.userId;
      } catch {}
    }

    if (!userId) {
      const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";
      return reply.redirect(
        `${clientOrigin}/login?redirect=${encodeURIComponent("/dashboard/storage")}`,
      );
    }

    const { provider } = request.params;
    const state = crypto.randomBytes(24).toString("hex");

    // Store CSRF state in Redis for 10 minutes linked to user
    await redis.set(
      `oauth_state:${state}`,
      JSON.stringify({ userId, provider }),
      "EX",
      600,
    );

    let authUrl = "";

    switch (provider) {
      case "google":
      case "google_drive": {
        const params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          redirect_uri:
            process.env.GOOGLE_REDIRECT_URI ||
            "http://localhost:4000/providers/google/callback",
          response_type: "code",
          scope: "https://www.googleapis.com/auth/drive.file email",
          access_type: "offline",
          prompt: "consent",
          state,
        });
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        break;
      }

      case "onedrive":
      case "one_drive": {
        const params = new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || "",
          redirect_uri:
            process.env.MICROSOFT_REDIRECT_URI ||
            "http://localhost:4000/providers/onedrive/callback",
          response_type: "code",
          response_mode: "query",
          scope: "files.readwrite offline_access user.read",
          prompt: "consent",
          state,
        });
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
        break;
      }

      case "dropbox": {
        const params = new URLSearchParams({
          client_id: process.env.DROPBOX_CLIENT_ID || "",
          redirect_uri:
            process.env.DROPBOX_REDIRECT_URI ||
            "http://localhost:4000/providers/dropbox/callback",
          response_type: "code",
          token_access_type: "offline",
          scope:
            "account_info.read files.content.write files.content.read files.metadata.write files.metadata.read",
          state,
        });
        authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
        break;
      }

      case "box": {
        const params = new URLSearchParams({
          client_id: process.env.BOX_CLIENT_ID || "",
          redirect_uri:
            process.env.BOX_REDIRECT_URI ||
            "http://localhost:4000/providers/box/callback",
          response_type: "code",
          state,
        });
        authUrl = `https://account.box.com/api/oauth2/authorize?${params.toString()}`;
        break;
      }

      default:
        return reply
          .status(400)
          .send({ error: `Unsupported provider: ${provider}` });
    }

    return reply.redirect(authUrl);
  };

  fastify.get("/:provider/connect", handleOAuthConnect);
  fastify.get("/:provider/auth", handleOAuthConnect);

  // -------------------------------------------------------------
  // 3. OAUTH CALLBACKS (/providers/:provider/callback)
  // -------------------------------------------------------------
  fastify.get(
    "/:provider/callback",
    async (
      request: FastifyRequest<{
        Params: { provider: string };
        Querystring: { code?: string; state?: string; error?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";
      const { provider } = request.params;
      const { code, state, error: oauthError } = request.query;

      if (oauthError || !code || !state) {
        return reply.redirect(
          `${clientOrigin}/dashboard?error=${encodeURIComponent(oauthError || "Auth denied")}`,
        );
      }

      const stateDataRaw = await redis.get(`oauth_state:${state}`);
      if (!stateDataRaw) {
        return reply.redirect(
          `${clientOrigin}/dashboard?error=Invalid_or_expired_state`,
        );
      }
      await redis.del(`oauth_state:${state}`);

      const { userId } = JSON.parse(stateDataRaw) as { userId: string };

      let accessToken = "";
      let refreshToken = "";
      let expiresIn = 3600;
      let accountEmail = "";
      let canonicalProvider: SupportedProvider = "google_drive";

      try {
        switch (provider) {
          case "google": {
            canonicalProvider = "google_drive";
            const tokenRes = await fetch(
              "https://oauth2.googleapis.com/token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  client_id: process.env.GOOGLE_CLIENT_ID || "",
                  client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                  code,
                  grant_type: "authorization_code",
                  redirect_uri:
                    process.env.GOOGLE_REDIRECT_URI ||
                    "http://localhost:4000/providers/google/callback",
                }),
              },
            );
            const tData = (await tokenRes.json()) as any;
            if (!tokenRes.ok)
              throw new Error(
                tData.error_description || "Google exchange failed",
              );

            accessToken = tData.access_token;
            refreshToken = tData.refresh_token || "";
            expiresIn = tData.expires_in || 3600;

            const uRes = await fetch(
              "https://www.googleapis.com/oauth2/v2/userinfo",
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            );
            const uData = (await uRes.json()) as any;
            accountEmail = uData.email || "";
            break;
          }

          case "onedrive": {
            canonicalProvider = "one_drive";
            const tokenRes = await fetch(
              "https://login.microsoftonline.com/common/oauth2/v2.0/token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  client_id: process.env.MICROSOFT_CLIENT_ID || "",
                  client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
                  code,
                  grant_type: "authorization_code",
                  redirect_uri:
                    process.env.MICROSOFT_REDIRECT_URI ||
                    "http://localhost:4000/providers/onedrive/callback",
                }),
              },
            );
            const tData = (await tokenRes.json()) as any;
            if (!tokenRes.ok)
              throw new Error(
                tData.error_description || "OneDrive exchange failed",
              );

            accessToken = tData.access_token;
            refreshToken = tData.refresh_token || "";
            expiresIn = tData.expires_in || 3600;

            const uRes = await fetch("https://graph.microsoft.com/v1.0/me", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const uData = (await uRes.json()) as any;
            accountEmail = uData.mail || uData.userPrincipalName || "";
            break;
          }

          case "dropbox": {
            canonicalProvider = "dropbox";
            const creds = Buffer.from(
              `${process.env.DROPBOX_CLIENT_ID}:${process.env.DROPBOX_CLIENT_SECRET}`,
            ).toString("base64");

            const tokenRes = await fetch(
              "https://api.dropboxapi.com/oauth2/token",
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${creds}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  code,
                  grant_type: "authorization_code",
                  redirect_uri:
                    process.env.DROPBOX_REDIRECT_URI ||
                    "http://localhost:4000/providers/dropbox/callback",
                }),
              },
            );
            const tData = (await tokenRes.json()) as any;
            if (!tokenRes.ok)
              throw new Error(
                tData.error_description || "Dropbox exchange failed",
              );

            accessToken = tData.access_token;
            refreshToken = tData.refresh_token || "";
            expiresIn = tData.expires_in || 14400;

            const uRes = await fetch(
              "https://api.dropboxapi.com/2/users/get_current_account",
              {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            );
            const uData = (await uRes.json()) as any;
            accountEmail = uData.email || "";
            break;
          }

          case "box": {
            canonicalProvider = "box";
            const tokenRes = await fetch("https://api.box.com/oauth2/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.BOX_CLIENT_ID || "",
                client_secret: process.env.BOX_CLIENT_SECRET || "",
                code,
                grant_type: "authorization_code",
                redirect_uri:
                  process.env.BOX_REDIRECT_URI ||
                  "http://localhost:4000/providers/box/callback",
              }),
            });
            const tData = (await tokenRes.json()) as any;
            if (!tokenRes.ok)
              throw new Error(tData.error_description || "Box exchange failed");

            accessToken = tData.access_token;
            refreshToken = tData.refresh_token || "";
            expiresIn = tData.expires_in || 3600;

            const uRes = await fetch("https://api.box.com/2.0/users/me", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const uData = (await uRes.json()) as any;
            accountEmail = uData.login || "";
            break;
          }

          default:
            throw new Error(`Unsupported callback provider: ${provider}`);
        }

        // Fetch live storage quota
        const adapter = getStorageAdapter(canonicalProvider);
        const quota = await adapter.fetchQuota(accessToken);

        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

        const [existing] = await db
          .select({ id: providerIdentities.id })
          .from(providerIdentities)
          .where(
            and(
              eq(providerIdentities.userId, userId),
              eq(providerIdentities.provider, canonicalProvider),
            ),
          );

        if (existing) {
          await db
            .update(providerIdentities)
            .set({
              accountEmail,
              encryptedAccessToken: encrypt(accessToken),
              encryptedRefreshToken: refreshToken
                ? encrypt(refreshToken)
                : undefined,
              tokenExpiresAt,
              quotaTotal: quota.totalBytes,
              quotaUsed: quota.usedBytes,
              lastSyncedAt: new Date(),
            })
            .where(eq(providerIdentities.id, existing.id));
        } else {
          await db.insert(providerIdentities).values({
            userId,
            provider: canonicalProvider,
            accountEmail,
            encryptedAccessToken: encrypt(accessToken),
            encryptedRefreshToken: encrypt(refreshToken),
            tokenExpiresAt,
            quotaTotal: quota.totalBytes,
            quotaUsed: quota.usedBytes,
          });
        }

        socketManager.broadcastToUser(userId, {
          type: "QUOTA_UPDATED",
          payload: { provider: canonicalProvider, quota },
        });

        return reply.redirect(
          `${clientOrigin}/dashboard?connected=${canonicalProvider}`,
        );
      } catch (err: any) {
        request.log.error(err, "OAuth callback failure");
        return reply.redirect(
          `${clientOrigin}/dashboard?error=${encodeURIComponent(err.message)}`,
        );
      }
    },
  );

  // -------------------------------------------------------------
  // 4. DISCONNECT PRE-FLIGHT CHECK (/providers/:id/disconnect-preview)
  // -------------------------------------------------------------
  fastify.get(
    "/:id/disconnect-preview",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const user = request.user as { userId: string };
      try {
        const preview = await ProviderCleanupService.getDisconnectPreview(
          user.userId,
          request.params.id,
        );
        return reply.send(preview);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  // -------------------------------------------------------------
  // 5. ASYNC DISCONNECT WORKER TRIGGER (/providers/:id/disconnect)
  // -------------------------------------------------------------
  fastify.post(
    "/:id/disconnect",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { action: "delete" | "migrate" };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const user = request.user as { userId: string };
      const { id } = request.params;
      const { action } = request.body || { action: "delete" };

      // 1. Check if any finalized chunks are stored on this provider
      const chunks = await db
        .select({ id: fileChunks.id })
        .from(fileChunks)
        .where(eq(fileChunks.providerIdentityId, id));

      if (chunks.length === 0) {
        // Clean up any stale in-flight upload chunks first
        await db
          .delete(uploadChunks)
          .where(eq(uploadChunks.providerIdentityId, id));

        // Instant disconnect for empty providers
        await db
          .delete(providerIdentities)
          .where(
            and(
              eq(providerIdentities.id, id),
              eq(providerIdentities.userId, user.userId),
            ),
          );

        socketManager.broadcastToUser(user.userId, {
          type: "PROVIDER_DISCONNECTED",
          payload: { providerId: id },
        });

        fastify.log.info(
          `[Providers] Provider [${id}] has 0 stored chunks. Disconnected instantly without worker.`,
        );

        return reply.send({
          success: true,
          message: "Provider disconnected immediately (no files stored).",
        });
      }

      // 2. When chunks exist, queue asynchronous BullMQ background job for migration/cleanup
      const job = await providerMigrationQueue.add("disconnect-provider", {
        userId: user.userId,
        providerIdentityId: id,
        action,
      });

      return reply.send({
        success: true,
        jobId: job.id,
        message: `Disconnection process started in background (${action} mode).`,
      });
    },
  );

  // -------------------------------------------------------------
  // 6. MANUAL QUOTA SYNC (/providers/:id/sync)
  // -------------------------------------------------------------
  fastify.post(
    "/:id/sync",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const user = request.user as { userId: string };
      const { id } = request.params;

      const [identity] = await db
        .select()
        .from(providerIdentities)
        .where(
          and(
            eq(providerIdentities.id, id),
            eq(providerIdentities.userId, user.userId),
          ),
        );

      if (!identity)
        return reply.status(404).send({ error: "Provider identity not found" });

      const adapter = getStorageAdapter(identity.provider);
      const accessToken = decrypt(identity.encryptedAccessToken);
      const quota = await adapter.fetchQuota(accessToken);

      await db
        .update(providerIdentities)
        .set({
          quotaTotal: quota.totalBytes,
          quotaUsed: quota.usedBytes,
          lastSyncedAt: new Date(),
        })
        .where(eq(providerIdentities.id, id));

      return reply.send({ quota });
    },
  );

  // -------------------------------------------------------------
  // 7. SYNC ALL QUOTAS ON DEMAND (/providers/sync-quotas)
  // -------------------------------------------------------------

  fastify.post(
    "/sync",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const { userId } = request.user as { userId: string };
      const identities = await db
        .select()
        .from(providerIdentities)
        .where(eq(providerIdentities.userId, userId));

      for (const identity of identities) {
        try {
          const accessToken = await TokenService.getValidAccessToken(
            identity.id,
          );
          const adapter = getStorageAdapter(identity.provider);
          const quota = await adapter.fetchQuota(accessToken);

          await db
            .update(providerIdentities)
            .set({
              quotaTotal: quota.totalBytes,
              quotaUsed: quota.usedBytes,
              lastSyncedAt: new Date(),
            })
            .where(eq(providerIdentities.id, identity.id));
        } catch (err: any) {
          request.log.warn(
            `Failed to sync quota for ${identity.provider}: ${err.message}`,
          );
        }
      }

      return reply.send({
        success: true,
        message: "All provider quotas refreshed.",
      });
    },
  );
}
