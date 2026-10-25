import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "node:crypto";
import {
  db,
  users,
  providerIdentities,
  fileChunks,
  uploadChunks,
  vfsNodes,
  migrationJobs,
} from "../db/index.js";
import { eq, and, ne, sql, inArray, isNull, or, desc } from "drizzle-orm";
import { encrypt, decrypt } from "../utils/crypto.js";
import { getStorageAdapter, SupportedProvider } from "../adapters/factory.js";
import { socketManager } from "../websocket/socket-manager.js";
import { ProviderCleanupService } from "../services/provider-cleanup.service.js";
import {
  providerMigrationQueue,
  queueProviderMigration,
  reconcileReconnectedProvider,
} from "../workers/provider-migration.worker.js";
import IORedis from "ioredis";
import {
  TokenService,
  ProviderAuthExpiredError,
} from "../services/token.service.js";
import { CacheService } from "../services/cache.service.js";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

redis.on("error", (err) => {
  console.warn(`[Redis:Providers] Warning: ${err.message}`);
});

// Dual-layer state: in-memory cache with TTL + best-effort Redis
const localOAuthStates = new Map<string, { data: string; expiresAt: number }>();

// Periodic in-memory cleanup of expired states
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of localOAuthStates.entries()) {
    if (val.expiresAt < now) {
      localOAuthStates.delete(key);
    }
  }
}, 60 * 1000);

const COOKIE_NAME = "fuze_session";

function getClientOrigin(request: FastifyRequest): string {
  const envOrigins = new Set(
    [
      process.env.CLIENT_ORIGIN,
      process.env.CLIENT_URL,
      ...(process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
        : []),
      process.env.NODE_ENV !== "production" ? "http://localhost:3000" : null,
    ].filter(Boolean) as string[],
  );

  const origin = ((request.headers.origin as string) || "").trim();
  if (envOrigins.has(origin)) {
    return origin;
  }
  const referer = request.headers.referer as string;
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (envOrigins.has(refOrigin)) {
        return refOrigin;
      }
    } catch {}
  }
  return process.env.CLIENT_ORIGIN || "http://localhost:3000";
}

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

    const cached = await CacheService.getProvidersSummary(user.userId);
    if (cached) {
      return reply.send(cached);
    }

    const items = await db
      .select({
        id: providerIdentities.id,
        provider: providerIdentities.provider,
        accountEmail: providerIdentities.accountEmail,
        quotaTotal: providerIdentities.quotaTotal,
        quotaUsed: providerIdentities.quotaUsed,
        isRevoked: providerIdentities.isRevoked,
        lastSyncedAt: providerIdentities.lastSyncedAt,
      })
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.userId, user.userId),
          eq(providerIdentities.isDisconnected, false),
          eq(providerIdentities.pendingRestore, false),
        ),
      );

    if (items.length === 0) {
      return reply.send({
        providers: [],
        summary: {
          totalPoolBytes: 0,
          usedPoolBytes: 0,
          freePoolBytes: 0,
        },
      });
    }

    const activeProviderIds = items.map((p) => p.id);

    // Only calculate storage used by files on active, connected providers
    const activeFiles = await db
      .select({ size: vfsNodes.size })
      .from(vfsNodes)
      .where(
        and(
          eq(vfsNodes.userId, user.userId),
          eq(vfsNodes.type, "file"),
          isNull(vfsNodes.trashedAt),
          inArray(
            vfsNodes.id,
            db
              .select({ vfsNodeId: fileChunks.vfsNodeId })
              .from(fileChunks)
              .where(inArray(fileChunks.providerIdentityId, activeProviderIds)),
          ),
        ),
      );

    const vfsUsedBytes = activeFiles.reduce(
      (sum, f) => sum + Number(f.size || 0),
      0,
    );
    const totalPool = items.reduce((sum, p) => sum + p.quotaTotal, 0);
    const rawUsedPool = items.reduce((sum, p) => sum + p.quotaUsed, 0);
    const usedPool = Math.min(totalPool, Math.max(rawUsedPool, vfsUsedBytes));

    const responsePayload = {
      providers: items,
      summary: {
        totalPoolBytes: totalPool,
        usedPoolBytes: usedPool,
        freePoolBytes: Math.max(0, totalPool - usedPool),
      },
    };

    await CacheService.setProvidersSummary(user.userId, responsePayload, 120);
    return reply.send(responsePayload);
  });

  // -------------------------------------------------------------
  // 2. OAUTH CONNECT REDIRECT (/providers/:provider/connect & /providers/:provider/auth)
  // -------------------------------------------------------------
  const handleOAuthConnect = async (
    request: FastifyRequest<{ Params: { provider: string } }>,
    reply: FastifyReply,
  ) => {
    let userId: string | undefined;

    // Check query token fallback (useful if cross-origin cookies are restricted)
    const queryToken = (request.query as any)?.token;
    if (queryToken) {
      try {
        const decoded = fastify.jwt.verify<{ userId: string }>(queryToken);
        userId = decoded.userId;
      } catch {}
    }

    if (!userId) {
      const rawCookie = request.cookies[COOKIE_NAME];
      if (rawCookie) {
        const unsigned = request.unsignCookie(rawCookie);
        const token =
          unsigned.valid && unsigned.value ? unsigned.value : rawCookie;
        try {
          const decoded = fastify.jwt.verify<{ userId: string }>(token);
          userId = decoded.userId;
        } catch {}
      }
    }

    if (!userId) {
      try {
        await request.jwtVerify();
        userId = (request.user as { userId: string })?.userId;
      } catch {}
    }

    const clientOrigin = getClientOrigin(request);

    if (!userId) {
      return reply.redirect(
        `${clientOrigin}/login?redirect=${encodeURIComponent("/dashboard/storage")}`,
      );
    }

    // Verify user is email verified before allowing provider linking
    const [dbUser] = await db
      .select({ id: users.id, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, userId));

    if (!dbUser || !dbUser.emailVerified) {
      return reply.redirect(
        `${clientOrigin}/dashboard/storage?error=${encodeURIComponent(
          "Please verify your email address before connecting cloud storage providers.",
        )}`,
      );
    }

    const { provider } = request.params;

    let canonicalProvider: SupportedProvider = "google_drive";
    if (provider === "google" || provider === "google_drive")
      canonicalProvider = "google_drive";
    else if (provider === "onedrive" || provider === "one_drive")
      canonicalProvider = "one_drive";
    else if (provider === "dropbox") canonicalProvider = "dropbox";
    else if (provider === "box") canonicalProvider = "box";
    else if (provider === "pcloud") canonicalProvider = "pcloud";

    // Enforce single-account per provider: Check if user already linked this provider
    const [existingProvider] = await db
      .select({
        id: providerIdentities.id,
        accountEmail: providerIdentities.accountEmail,
        isDisconnected: providerIdentities.isDisconnected,
      })
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.userId, userId),
          eq(providerIdentities.provider, canonicalProvider),
        ),
      );

    const isReconnect =
      request.url.includes("reconnect") ||
      (request.query as any)?.reconnect === "true" ||
      (request.query as any)?.reconnect === "1" ||
      Boolean(existingProvider?.isDisconnected);

    if (existingProvider && !existingProvider.isDisconnected && !isReconnect) {
      const displayName = canonicalProvider
        .replace("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return reply.redirect(
        `${clientOrigin}/dashboard/storage?error=${encodeURIComponent(
          `You already have a connected ${displayName} account (${existingProvider.accountEmail || ""}). Click Reconnect to refresh tokens.`,
        )}`,
      );
    }

    const state = crypto.randomBytes(24).toString("hex");

    const statePayload = JSON.stringify({
      userId,
      provider,
      clientOrigin,
      returnUrl: "/dashboard/storage",
      isReconnect,
      existingEmail: existingProvider?.accountEmail,
    });

    // 1. Store locally in-memory with 10 min TTL
    localOAuthStates.set(state, {
      data: statePayload,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // 2. Best-effort mirror to Redis if available
    try {
      await redis.set(`oauth_state:${state}`, statePayload, "EX", 600);
    } catch (err: any) {
      fastify.log.warn(
        `[OAuth] Redis state store failed (${err.message}). Using memory fallback.`,
      );
    }

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
        if (existingProvider?.accountEmail) {
          params.set("login_hint", existingProvider.accountEmail);
        }
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
        if (existingProvider?.accountEmail) {
          params.set("login_hint", existingProvider.accountEmail);
        }
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
        if (existingProvider?.accountEmail) {
          params.set("force_reapprove", "true");
        }
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
        if (existingProvider?.accountEmail) {
          params.set("box_login", existingProvider.accountEmail);
        }
        authUrl = `https://account.box.com/api/oauth2/authorize?${params.toString()}`;
        break;
      }

      case "pcloud": {
        const params = new URLSearchParams({
          client_id: process.env.PCLOUD_CLIENT_ID || "",
          redirect_uri:
            process.env.PCLOUD_REDIRECT_URI ||
            "http://localhost:4000/providers/pcloud/callback",
          response_type: "code",
          state,
        });
        authUrl = `https://my.pcloud.com/oauth2/authorize?${params.toString()}`;
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
  fastify.get("/:provider/reconnect", handleOAuthConnect);
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
      const fallbackOrigin = getClientOrigin(request);
      const { provider } = request.params;
      const { code, state, error: oauthError } = request.query;

      if (oauthError || !code || !state) {
        return reply.redirect(
          `${fallbackOrigin}/dashboard/storage?error=${encodeURIComponent(oauthError || "Authorization was denied or canceled.")}`,
        );
      }

      let stateDataRaw: string | null = null;

      // 1. Check local in-memory store
      const local = localOAuthStates.get(state);
      if (local) {
        localOAuthStates.delete(state);
        if (Date.now() < local.expiresAt) {
          stateDataRaw = local.data;
        }
      }

      // 2. Check Redis fallback if not found locally
      if (!stateDataRaw) {
        try {
          stateDataRaw = await redis.get(`oauth_state:${state}`);
          if (stateDataRaw) {
            await redis.del(`oauth_state:${state}`).catch(() => {});
          }
        } catch (err: any) {
          fastify.log.warn(
            `[OAuth] Redis state fetch failed (${err.message}).`,
          );
        }
      }

      if (!stateDataRaw) {
        return reply.redirect(
          `${fallbackOrigin}/dashboard/storage?error=${encodeURIComponent("Authorization session expired. Please try connecting again.")}`,
        );
      }

      const stateObj = JSON.parse(stateDataRaw) as {
        userId: string;
        clientOrigin?: string;
        returnUrl?: string;
        isReconnect?: boolean;
        existingEmail?: string;
      };
      const clientOrigin = stateObj.clientOrigin || fallbackOrigin;
      const { userId } = stateObj;

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

          case "pcloud": {
            canonicalProvider = "pcloud";
            const tokenRes = await fetch(
              "https://api.pcloud.com/oauth2_token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  client_id: process.env.PCLOUD_CLIENT_ID || "",
                  client_secret: process.env.PCLOUD_CLIENT_SECRET || "",
                  code,
                }),
              },
            );
            const tData = (await tokenRes.json()) as any;
            if (
              !tokenRes.ok ||
              (tData.result !== undefined && tData.result !== 0)
            ) {
              throw new Error(
                tData.error ||
                  tData.error_description ||
                  `pCloud token exchange failed (code: ${tData.result})`,
              );
            }

            accessToken = tData.access_token;
            // pCloud access tokens are permanent until explicitly revoked by user
            refreshToken = tData.access_token;
            expiresIn = 315360000; // 10 years

            const baseApi =
              tData.locationid === 2
                ? "https://eapi.pcloud.com"
                : "https://api.pcloud.com";

            const uRes = await fetch(
              `${baseApi}/userinfo?access_token=${accessToken}`,
            );
            const uData = (await uRes.json()) as any;
            if (uData.result !== 0) {
              throw new Error(
                `Failed to fetch pCloud user profile (code: ${uData.result})`,
              );
            }
            accountEmail = uData.email || "";
            break;
          }

          default:
            throw new Error(`Unsupported callback provider: ${provider}`);
        }

        // Fetch live storage quota
        const adapter = getStorageAdapter(canonicalProvider);
        const quota = await adapter.fetchQuota(accessToken);

        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

        // -------------------------------------------------------------
        // Cross-User Account Collision Protection:
        // Ensure no OTHER Fuze user has already linked this exact same cloud account.
        // -------------------------------------------------------------
        if (accountEmail) {
          const normalizedEmail = accountEmail.trim().toLowerCase();
          const [claimedByOther] = await db
            .select({
              id: providerIdentities.id,
              userId: providerIdentities.userId,
            })
            .from(providerIdentities)
            .where(
              and(
                ne(providerIdentities.userId, userId),
                eq(providerIdentities.provider, canonicalProvider),
                sql`LOWER(TRIM(${providerIdentities.accountEmail})) = ${normalizedEmail}`,
              ),
            );

          if (claimedByOther) {
            const displayName = canonicalProvider
              .replace("_", " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            return reply.redirect(
              `${clientOrigin}/dashboard/storage?error=${encodeURIComponent(
                `This ${displayName} account (${accountEmail}) is already connected by another Fuze user. A cloud account can only be linked to one Fuze profile at a time to prevent data collisions and unauthorized access.`,
              )}`,
            );
          }
        }

        const [existing] = await db
          .select({
            id: providerIdentities.id,
            accountEmail: providerIdentities.accountEmail,
            isDisconnected: providerIdentities.isDisconnected,
          })
          .from(providerIdentities)
          .where(
            and(
              eq(providerIdentities.userId, userId),
              eq(providerIdentities.provider, canonicalProvider),
            ),
          );

        let linkedProviderId: string | undefined;

        if (existing) {
          const expectedEmail = existing.accountEmail || stateObj.existingEmail;
          if (
            expectedEmail &&
            accountEmail &&
            expectedEmail.trim().toLowerCase() !==
              accountEmail.trim().toLowerCase()
          ) {
            const displayName = canonicalProvider
              .replace("_", " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            return reply.redirect(
              `${clientOrigin}/dashboard/storage?error=${encodeURIComponent(
                `Account mismatch: This ${displayName} connection is registered to ${expectedEmail}. You authenticated with ${accountEmail}. Please reconnect with ${expectedEmail} to protect your indexed files.`,
              )}`,
            );
          }

          await db
            .update(providerIdentities)
            .set({
              accountEmail: accountEmail || existing.accountEmail,
              encryptedAccessToken: encrypt(accessToken),
              encryptedRefreshToken: refreshToken
                ? encrypt(refreshToken)
                : undefined,
              tokenExpiresAt,
              quotaTotal: quota.totalBytes,
              quotaUsed: quota.usedBytes,
              isRevoked: false,
              lastSyncedAt: new Date(),
            })
            .where(eq(providerIdentities.id, existing.id));
          linkedProviderId = existing.id;
        } else {
          const [newIdentity] = await db
            .insert(providerIdentities)
            .values({
              userId,
              provider: canonicalProvider,
              accountEmail,
              encryptedAccessToken: encrypt(accessToken),
              encryptedRefreshToken: encrypt(refreshToken),
              tokenExpiresAt,
              quotaTotal: quota.totalBytes,
              quotaUsed: quota.usedBytes,
              isRevoked: false,
            })
            .returning();
          linkedProviderId = newIdentity?.id;
        }

        socketManager.broadcastToUser(userId, {
          type: "PROVIDER_CONNECTED",
          payload: { provider: canonicalProvider, quota, isRevoked: false },
        });

        socketManager.broadcastToUser(userId, {
          type: "PROVIDER_STATUS_CHANGED",
          payload: { provider: canonicalProvider, isRevoked: false },
        });

        socketManager.broadcastToUser(userId, {
          type: "QUOTA_UPDATED",
          payload: { provider: canonicalProvider, quota },
        });

        await CacheService.invalidateUserProviders(userId);
        await CacheService.invalidateUserVfs(userId);

        const targetProviderId = linkedProviderId || existing?.id;
        if (targetProviderId) {
          try {
            await reconcileReconnectedProvider(userId, targetProviderId);
          } catch (e: any) {
            request.log.warn(`[Reconnection] Error reconciling provider: ${e?.message}`);
          }
        }

        const targetPath = stateObj.returnUrl || "/dashboard/storage";
        return reply.redirect(
          `${clientOrigin}${targetPath}?connected=${canonicalProvider}`,
        );
      } catch (err: any) {
        request.log.error(err, "OAuth callback failure");
        return reply.redirect(
          `${clientOrigin}/dashboard/storage?error=${encodeURIComponent(err.message)}`,
        );
      }
    },
  );

  // -------------------------------------------------------------
  // MIGRATIONS: ACTIVE JOB & HISTORY MONITORING
  // -------------------------------------------------------------
  fastify.get(
    "/migrations/active",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const user = request.user as { userId: string };

      const [activeJob] = await db
        .select()
        .from(migrationJobs)
        .where(
          and(
            eq(migrationJobs.userId, user.userId),
            or(
              eq(migrationJobs.status, "running"),
              eq(migrationJobs.status, "pending"),
            ),
          ),
        )
        .orderBy(desc(migrationJobs.startedAt))
        .limit(1);

      if (!activeJob) {
        return reply.send({ job: null });
      }

      let parsedLogs: any[] = [];
      try {
        parsedLogs = activeJob.logs ? JSON.parse(activeJob.logs) : [];
      } catch {}

      return reply.send({
        job: {
          id: activeJob.id,
          jobId: activeJob.id,
          providerId: activeJob.providerIdentityId,
          provider: activeJob.provider,
          action: activeJob.action,
          status: activeJob.status,
          completed: activeJob.completedChunks,
          total: activeJob.totalChunks,
          percent: activeJob.percent,
          transferredBytes: Number(activeJob.transferredBytes || 0),
          totalBytes: Number(activeJob.totalBytes || 0),
          currentFileName: activeJob.currentFileName,
          statusText: activeJob.statusText,
          logs: parsedLogs,
          startedAt: activeJob.startedAt,
        },
      });
    },
  );

  fastify.get(
    "/migrations/history",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const user = request.user as { userId: string };

      const jobs = await db
        .select()
        .from(migrationJobs)
        .where(eq(migrationJobs.userId, user.userId))
        .orderBy(desc(migrationJobs.startedAt))
        .limit(10);

      const items = jobs.map((job) => {
        let parsedLogs: any[] = [];
        try {
          parsedLogs = job.logs ? JSON.parse(job.logs) : [];
        } catch {}
        return {
          id: job.id,
          jobId: job.id,
          providerId: job.providerIdentityId,
          provider: job.provider,
          action: job.action,
          status: job.status,
          completed: job.completedChunks,
          total: job.totalChunks,
          percent: job.percent,
          transferredBytes: Number(job.transferredBytes || 0),
          totalBytes: Number(job.totalBytes || 0),
          currentFileName: job.currentFileName,
          statusText: job.statusText,
          logs: parsedLogs,
          errorMessage: job.errorMessage,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        };
      });

      return reply.send({ history: items });
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
        Body: { action: "delete" | "migrate" | "smart_unlink" };
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

      // 1. Fetch chunks on this provider
      const chunks = await db
        .select({
          id: fileChunks.id,
          vfsNodeId: fileChunks.vfsNodeId,
          byteStart: fileChunks.byteStart,
          byteEnd: fileChunks.byteEnd,
        })
        .from(fileChunks)
        .where(eq(fileChunks.providerIdentityId, id));

      // 1.1 Strict Pre-flight Check for Full Evacuation ("migrate")
      if (action === "migrate" && chunks.length > 0) {
        const preview = await ProviderCleanupService.getDisconnectPreview(
          user.userId,
          id,
        );
        if (!preview.canMigrate) {
          return reply.status(400).send({
            error:
              "Cannot evacuate files: Remaining connected storage does not have enough capacity to hold all files. Please connect another cloud or free up space.",
          });
        }
      }

      // 2. FAST-PATH: If 0 chunks exist, or if Smart Evacuate has no multi-cloud split chunks
      let needsWorker = chunks.length > 0;
      if (action === "smart_unlink" && chunks.length > 0) {
        const nodeIds = Array.from(new Set(chunks.map((c) => c.vfsNodeId)));
        const siblingChunks = await db
          .select({
            id: fileChunks.id,
            providerIdentityId: fileChunks.providerIdentityId,
          })
          .from(fileChunks)
          .where(
            and(
              inArray(fileChunks.vfsNodeId, nodeIds),
              ne(fileChunks.providerIdentityId, id),
            ),
          );

        // If 0 sibling chunks on other clouds, ALL files are whole files!
        if (siblingChunks.length === 0) {
          needsWorker = false;
        }
      }

      if (!needsWorker) {
        // Clean up in-flight uploads, chunks, and orphaned VFS nodes synchronously
        await db
          .delete(uploadChunks)
          .where(eq(uploadChunks.providerIdentityId, id));

        if (action === "smart_unlink") {
          // Soft-disconnect: Preserve all file records, set isDisconnected = true
          await db
            .update(providerIdentities)
            .set({
              isDisconnected: true,
              pendingRestore: false,
              isRevoked: false,
            })
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

          await CacheService.invalidateUserProviders(user.userId);
          await CacheService.invalidateUserVfs(user.userId);

          return reply.send({
            success: true,
            message: "Provider unlinked safely (files preserved in cloud).",
          });
        }

        // Action === "delete": permanently wipe chunks and provider row
        await db
          .delete(fileChunks)
          .where(eq(fileChunks.providerIdentityId, id));
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

        await CacheService.invalidateUserProviders(user.userId);
        await CacheService.invalidateUserVfs(user.userId);

        fastify.log.info(
          `[Providers] Provider [${id}] fast-path disconnected instantly without worker.`,
        );

        return reply.send({
          success: true,
          message:
            "Provider unlinked instantly (whole files preserved in cloud).",
        });
      }

      // 3. Heavy evacuation needed: queue background BullMQ worker
      // 3. Create persistent migrationJobs record in DB
      const [targetProv] = await db
        .select()
        .from(providerIdentities)
        .where(
          and(
            eq(providerIdentities.id, id),
            eq(providerIdentities.userId, user.userId),
          ),
        );

      const totalBytes = chunks.reduce(
        (sum, c) => sum + (Number(c.byteEnd) - Number(c.byteStart)),
        0,
      );

      const [newJob] = await db
        .insert(migrationJobs)
        .values({
          userId: user.userId,
          providerIdentityId: id,
          provider: targetProv?.provider || "cloud",
          action,
          status: "running",
          totalChunks: chunks.length,
          totalBytes,
          percent: 0,
          statusText: `Preparing ${action === "migrate" ? "full cloud evacuation" : "smart chunk relocation"}...`,
          logs: JSON.stringify([
            {
              timestamp: new Date().toISOString(),
              level: "info",
              message: `Job queued: Processing ${chunks.length} chunk(s) (${(totalBytes / (1024 * 1024)).toFixed(2)} MB) from ${(targetProv?.provider || "").toUpperCase()} (${action.toUpperCase()} mode).`,
            },
          ]),
        })
        .returning({ id: migrationJobs.id });

      const queued = await queueProviderMigration({
        userId: user.userId,
        providerIdentityId: id,
        action,
        migrationJobId: newJob.id,
      });

      return reply.send({
        success: true,
        jobId: newJob.id,
        message: `Disconnection process started in background (${action} mode).`,
      });
    },
  );

  // -------------------------------------------------------------
  // 6. PENDING RESTORE APIS (Banner & Re-Link Management)
  // -------------------------------------------------------------
  fastify.get(
    "/pending-restore",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const user = request.user as { userId: string };

      const disconnected = await db
        .select({
          id: providerIdentities.id,
          provider: providerIdentities.provider,
          accountEmail: providerIdentities.accountEmail,
        })
        .from(providerIdentities)
        .where(
          and(
            eq(providerIdentities.userId, user.userId),
            eq(providerIdentities.pendingRestore, true),
          ),
        );

      const pending = [];
      for (const p of disconnected) {
        const [stats] = await db
          .select({
            count: sql<number>`count(distinct ${fileChunks.vfsNodeId})`,
          })
          .from(fileChunks)
          .where(eq(fileChunks.providerIdentityId, p.id));
        const count = Number(stats?.count || 0);
        if (count > 0) {
          pending.push({
            id: p.id,
            provider: p.provider,
            accountEmail: p.accountEmail,
            fileCount: count,
          });
        }
      }

      return reply.send({ pending });
    },
  );

  fastify.post(
    "/:id/restore-pending",
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

      if (!identity) {
        return reply.status(404).send({ error: "Provider not found" });
      }

      await reconcileReconnectedProvider(user.userId, id);

      socketManager.broadcastToUser(user.userId, {
        type: "PROVIDER_CONNECTED",
        payload: { provider: identity.provider, isRevoked: false },
      });

      socketManager.broadcastToUser(user.userId, {
        type: "FILE_CREATED",
        payload: { action: "restore", providerId: id },
      });

      return reply.send({
        success: true,
        message: "Files restored to Drive successfully.",
      });
    },
  );

  fastify.post(
    "/:id/discard-pending",
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

      if (!identity) {
        return reply.status(404).send({ error: "Provider not found" });
      }

      const chunks = await db
        .select({ vfsNodeId: fileChunks.vfsNodeId })
        .from(fileChunks)
        .where(eq(fileChunks.providerIdentityId, id));

      const nodeIds = Array.from(new Set(chunks.map((c) => c.vfsNodeId)));

      await db.delete(fileChunks).where(eq(fileChunks.providerIdentityId, id));

      if (nodeIds.length > 0) {
        const remaining = await db
          .select({ vfsNodeId: fileChunks.vfsNodeId })
          .from(fileChunks)
          .where(inArray(fileChunks.vfsNodeId, nodeIds));
        const activeIds = new Set(remaining.map((c) => c.vfsNodeId));
        const orphanIds = nodeIds.filter((nid) => !activeIds.has(nid));
        if (orphanIds.length > 0) {
          await db.delete(vfsNodes).where(inArray(vfsNodes.id, orphanIds));
        }
      }

      await db
        .update(providerIdentities)
        .set({ isDisconnected: false, pendingRestore: false })
        .where(eq(providerIdentities.id, id));

      socketManager.broadcastToUser(user.userId, {
        type: "PROVIDER_CONNECTED",
        payload: { provider: identity.provider, isRevoked: false },
      });

      return reply.send({
        success: true,
        message: "Cleared disconnected file records. Provider is fresh.",
      });
    },
  );

  // -------------------------------------------------------------
  // 6. MANUAL QUOTA SYNC & STATUS CHECK (/providers/:id/sync)
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

      try {
        const accessToken = await TokenService.getValidAccessToken(id);
        const adapter = getStorageAdapter(identity.provider);
        const quota = await adapter.fetchQuota(accessToken);

        await db
          .update(providerIdentities)
          .set({
            quotaTotal: quota.totalBytes,
            quotaUsed: quota.usedBytes,
            isRevoked: false,
            lastSyncedAt: new Date(),
          })
          .where(eq(providerIdentities.id, id));

        socketManager.broadcastToUser(user.userId, {
          type: "PROVIDER_STATUS_CHANGED",
          payload: {
            providerId: id,
            provider: identity.provider,
            isRevoked: false,
          },
        });

        return reply.send({ quota, isRevoked: false });
      } catch (err: any) {
        request.log.warn(
          `Failed sync for provider ${identity.provider} [${id}]: ${err.message}`,
        );

        const isRevoked =
          err instanceof ProviderAuthExpiredError ||
          err.message?.includes("invalid_grant") ||
          err.message?.includes("expired") ||
          err.message?.includes("revoked") ||
          err.message?.includes("401");

        if (isRevoked) {
          await TokenService.markRevoked(id, err.message);
        }

        return reply.status(424).send({
          error: err.message,
          isRevoked: true,
          provider: identity.provider,
        });
      }
    },
  );

  // -------------------------------------------------------------
  // 7. SYNC ALL QUOTAS & RUN STATUS HEALTH CHECK (/providers/sync & /providers/health-check)
  // -------------------------------------------------------------
  const handleSyncAndHealthCheck = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
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

    const results: Array<{
      id: string;
      provider: string;
      accountEmail: string | null;
      isRevoked: boolean;
      error?: string;
    }> = [];

    for (const identity of identities) {
      const verification = await TokenService.verifyConnection(identity.id);
      results.push({
        id: identity.id,
        provider: identity.provider,
        accountEmail: identity.accountEmail,
        isRevoked: verification.isRevoked,
        error: verification.error,
      });
    }

    socketManager.broadcastToUser(userId, {
      type: "PROVIDER_STATUS_CHANGED",
      payload: { results },
    });

    await CacheService.invalidateUserProviders(userId);

    return reply.send({
      success: true,
      message: "All provider quotas and connection health statuses refreshed.",
      results,
    });
  };

  // -------------------------------------------------------------------------
  // CANCEL ACTIVE MIGRATION (/providers/migrations/cancel)
  // -------------------------------------------------------------------------
  fastify.post(
    "/migrations/cancel",
    async (
      request: FastifyRequest<{ Body: { jobId: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const user = request.user as { userId: string };
      const { jobId } = request.body || {};

      if (!jobId) {
        return reply.status(400).send({ error: "Missing jobId parameter" });
      }

      const [job] = await db
        .select()
        .from(migrationJobs)
        .where(
          and(
            eq(migrationJobs.id, jobId),
            eq(migrationJobs.userId, user.userId),
          ),
        );

      if (!job) {
        return reply.status(404).send({ error: "Migration job not found" });
      }

      if (job.status !== "running" && job.status !== "pending") {
        return reply.status(400).send({ error: "Job is already finalized" });
      }

      await db
        .update(migrationJobs)
        .set({
          status: "cancelled",
          statusText:
            "Cancelling migration... Already moved files remain safe.",
        })
        .where(eq(migrationJobs.id, jobId));

      socketManager.broadcastToUser(user.userId, {
        type: "PROVIDER_MIGRATION_CANCELLED",
        payload: {
          jobId,
          message:
            "Migration cancelled. Transferred files remain safe on destination.",
        },
      });

      return reply.send({
        success: true,
        message: "Migration cancellation requested successfully.",
      });
    },
  );

  fastify.post("/sync", handleSyncAndHealthCheck);
  fastify.post("/health-check", handleSyncAndHealthCheck);
  fastify.get("/health-check", handleSyncAndHealthCheck);
}
