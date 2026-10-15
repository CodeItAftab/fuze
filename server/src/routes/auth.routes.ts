import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db, users, userSessions } from "../db/index.js";
import { eq, and, gt, ne } from "drizzle-orm";
import { z } from "zod";
import { EmailService } from "../services/email.service.js";
import { VfsService } from "../services/vfs.service.js";
import { socketManager } from "../websocket/socket-manager.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email().toLowerCase().optional(),
  token: z.string().trim().optional(),
  code: z.string().trim().optional(),
});

const resendVerificationSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase().optional(),
  token: z.string().trim().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const COOKIE_NAME = "fuze_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function getCookieDomain(request: FastifyRequest): string | undefined {
  if (process.env.COOKIE_DOMAIN) {
    return process.env.COOKIE_DOMAIN;
  }
  const rootDomain = (process.env.APP_DOMAIN || "fuzedrive.tech").toLowerCase().trim();
  const host = (request.headers.host || "").split(":")[0].toLowerCase().trim();

  // Exact match on the domain or its official subdomains
  if (host === rootDomain || host === `www.${rootDomain}` || host === `api.${rootDomain}`) {
    return `.${rootDomain}`;
  }
  return undefined;
}

function getRequestClientOrigin(request: FastifyRequest): string {
  const rootDomain = (process.env.APP_DOMAIN || "fuzedrive.tech").toLowerCase().trim();
  const origin = ((request.headers.origin as string) || "").trim();
  const allowed = new Set([
    `https://${rootDomain}`,
    `https://www.${rootDomain}`,
    process.env.CLIENT_ORIGIN,
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : null,
  ].filter(Boolean) as string[]);

  if (allowed.has(origin)) {
    return origin;
  }
  return process.env.CLIENT_ORIGIN || `https://${rootDomain}`;
}

export async function authRoutes(fastify: FastifyInstance) {
  // 1. REGISTER
  fastify.post(
    "/register",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = registerSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({
          error: parse.error.errors[0]?.message || "Validation error",
        });
      }

      const { name, email, password } = parse.data;

      const [existing] = await db
        .select({ id: users.id, emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.email, email));

      if (existing) {
        if (!existing.emailVerified) {
          // If the account was already created but never verified, refresh verification code and prompt them
          const rawToken = crypto.randomBytes(32).toString("hex");
          const hashedToken = hashToken(rawToken);
          const code = generateVerificationCode();
          const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

          await db
            .update(users)
            .set({
              verificationToken: hashedToken,
              rawVerificationToken: rawToken,
              verificationExpiresAt: expiresAt,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing.id));

          // Send verification email non-blocking & fault-tolerantly
          EmailService.sendVerificationEmail({
            to: email,
            name,
            token: rawToken,
          }).catch((err) => {
            console.error("[EmailService] Background delivery error:", err);
          });

          return reply.status(200).send({
            message: "A verification email has been sent. Please check your inbox.",
            unverified: true,
            email,
          });
        }

        return reply.status(409).send({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = hashToken(rawToken);
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          emailVerified: false,
          verificationToken: hashedToken,
          rawVerificationToken: rawToken,
          verificationCode: code,
          verificationExpiresAt: expiresAt,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
        });

      // Send verification email non-blocking & fault-tolerantly
      EmailService.sendVerificationEmail({
        to: email,
        name,
        token: rawToken,
        clientOrigin: getRequestClientOrigin(request),
      }).catch((err) => {
        console.error("[EmailService] Background delivery error:", err);
      });

      // Auto-issue session so the user lands on the dashboard with the verification banner
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await db.insert(userSessions).values({
        userId: newUser!.id,
        token: sessionToken,
        userAgent: request.headers["user-agent"] || "Unknown Device",
        expiresAt: sessionExpiresAt,
      });

      const jwtToken = fastify.jwt.sign(
        { userId: newUser!.id, sessionToken },
        { expiresIn: "7d" },
      );

      reply.setCookie(COOKIE_NAME, jwtToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: getCookieDomain(request),
        expires: sessionExpiresAt,
        signed: true,
      });

      return reply.status(201).send({
        user: newUser,
        token: jwtToken,
        message: "Registration successful. Please verify your email.",
      });
    },
  );

  // 2. VERIFY EMAIL
  fastify.post(
    "/verify-email",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = verifyEmailSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Invalid verification data" });
      }

      const { email, token, code } = parse.data;

      if (!token && (!code || !email)) {
        return reply.status(400).send({
          error: "Either verification link or email and 6-digit code are required",
        });
      }

      let userToVerify = null;

      if (token) {
        const hashedToken = hashToken(token);
        const [found] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.verificationToken, hashedToken),
              gt(users.verificationExpiresAt, new Date()),
            ),
          );
        userToVerify = found;
      } else if (code && email) {
        const [found] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, email),
              eq(users.verificationCode, code.trim()),
              gt(users.verificationExpiresAt, new Date()),
            ),
          );
        userToVerify = found;
      }

      if (!userToVerify) {
        return reply.status(400).send({
          error: "Invalid or expired verification link/code. Please request a new one.",
        });
      }

      // Mark verified and clear tokens
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          rawVerificationToken: null,
          verificationCode: null,
          verificationExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userToVerify.id));

      // Auto-issue session upon successful verification
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await db.insert(userSessions).values({
        userId: userToVerify.id,
        token: sessionToken,
        userAgent: request.headers["user-agent"] || "Unknown Device",
        expiresAt: sessionExpiresAt,
      });

      const jwtToken = fastify.jwt.sign(
        { userId: userToVerify.id, sessionToken },
        { expiresIn: "7d" },
      );

      reply.setCookie(COOKIE_NAME, jwtToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: getCookieDomain(request),
        expires: sessionExpiresAt,
        signed: true,
      });

      return reply.send({
        success: true,
        message: "Email verified successfully!",
        user: {
          id: userToVerify.id,
          name: userToVerify.name,
          email: userToVerify.email,
          emailVerified: true,
        },
        token: jwtToken,
      });
    },
  );

  // 3. RESEND VERIFICATION EMAIL
  fastify.post(
    "/resend-verification",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = resendVerificationSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Valid email is required" });
      }

      const { email } = parse.data;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return reply.status(404).send({
          error: "No account found with this email address. Please register first.",
        });
      }

      if (user.emailVerified) {
        return reply.status(400).send({
          error: "This email address is already verified. You can sign in.",
        });
      }

      const now = new Date();
      let rawToken = user.rawVerificationToken;
      let expiresAt = user.verificationExpiresAt;

      // Smart Token Reuse: If an active token exists and has NOT expired, resend the same token!
      // This prevents link collisions, duplicate confusing emails, and race conditions.
      const hasValidToken =
        rawToken &&
        expiresAt &&
        new Date(expiresAt).getTime() > now.getTime();

      if (!hasValidToken) {
        rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = hashToken(rawToken);
        expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

        await db
          .update(users)
          .set({
            verificationToken: hashedToken,
            rawVerificationToken: rawToken,
            verificationExpiresAt: expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }

      // Asynchronous non-blocking dispatch
      EmailService.sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: rawToken!,
      }).catch((err) => {
        console.error("[EmailService] Background delivery error:", err);
      });

      return reply.send({
        success: true,
        reused: Boolean(hasValidToken),
        message: hasValidToken
          ? "We've resent your active verification link to your email."
          : "A new verification link has been sent to your email.",
      });
    },
  );

  // 4. FORGOT PASSWORD
  fastify.post(
    "/forgot-password",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = forgotPasswordSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Valid email is required" });
      }

      const { email } = parse.data;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return reply.status(404).send({
          error: "No account found with this email address. Please check your spelling or sign up.",
        });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

      await db
        .update(users)
        .set({
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Asynchronous non-blocking dispatch
      EmailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: rawToken,
      }).catch((err) => {
        console.error("[EmailService] Background delivery error:", err);
      });

      return reply.send({
        success: true,
        message: "Password reset instructions have been sent to your email.",
      });
    },
  );

  // 5. RESET PASSWORD
  fastify.post(
    "/reset-password",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = resetPasswordSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({
          error: parse.error.errors[0]?.message || "Invalid reset details",
        });
      }

      const { token, password, email } = parse.data;
      const hashedToken = hashToken(token);

      const queryConditions = [
        eq(users.passwordResetToken, hashedToken),
        gt(users.passwordResetExpiresAt, new Date()),
      ];

      if (email) {
        queryConditions.push(eq(users.email, email));
      }

      const [user] = await db
        .select()
        .from(users)
        .where(and(...queryConditions));

      if (!user) {
        return reply.status(400).send({
          error: "Password reset link is invalid or has expired. Please request a new one.",
        });
      }

      const newPasswordHash = await bcrypt.hash(password, 12);

      // Invalidate password reset token, update password hash, and mark email as verified if not yet
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Security best-practice: Revoke all existing active sessions upon password reset
      await db.delete(userSessions).where(eq(userSessions.userId, user.id));

      return reply.send({
        success: true,
        message: "Your password has been reset successfully. You can now sign in.",
      });
    },
  );

  // 6. LOGIN
  fastify.post(
    "/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = loginSchema.safeParse(request.body);
      if (!parse.success)
        return reply.status(400).send({ error: "Invalid input" });

      const { email, password } = parse.data;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user || !user.passwordHash) {
        return reply.status(401).send({ error: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch)
        return reply.status(401).send({ error: "Invalid email or password" });

      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await db.insert(userSessions).values({
        userId: user.id,
        token: sessionToken,
        userAgent: request.headers["user-agent"] || "Unknown Device",
        expiresAt,
      });

      const jwtToken = fastify.jwt.sign(
        { userId: user.id, sessionToken },
        { expiresIn: "7d" },
      );

      reply.setCookie(COOKIE_NAME, jwtToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: getCookieDomain(request),
        expires: expiresAt,
        signed: true,
      });

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        },
        token: jwtToken,
      });
    },
  );

  // 7. LOGOUT
  fastify.post(
    "/logout",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const rawCookie = request.cookies[COOKIE_NAME];
      if (rawCookie) {
        const unsigned = request.unsignCookie(rawCookie);
        if (unsigned.valid && unsigned.value) {
          try {
            const decoded = fastify.jwt.verify<{ sessionToken: string }>(
              unsigned.value,
            );
            await db
              .delete(userSessions)
              .where(eq(userSessions.token, decoded.sessionToken));
          } catch {}
        }
      }
      reply.clearCookie(COOKIE_NAME, {
        path: "/",
        domain: getCookieDomain(request),
      });
      return reply.send({ message: "Logged out" });
    },
  );

  // 8. ME
  fastify.get("/me", async (request: FastifyRequest, reply: FastifyReply) => {
    const rawCookie = request.cookies[COOKIE_NAME];
    const authHeader = request.headers.authorization;
    let token = authHeader?.replace("Bearer ", "");

    if (!token && rawCookie) {
      const unsigned = request.unsignCookie(rawCookie);
      if (unsigned.valid) token = unsigned.value;
    }

    if (!token) return reply.status(401).send({ error: "Unauthenticated" });

    try {
      const decoded = fastify.jwt.verify<{
        userId: string;
        sessionToken: string;
      }>(token);
      const [session] = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.token, decoded.sessionToken),
            gt(userSessions.expiresAt, new Date()),
          ),
        );

      if (!session) {
        reply.clearCookie(COOKIE_NAME, {
          path: "/",
          domain: getCookieDomain(request),
        });
        return reply.status(401).send({ error: "Session revoked" });
      }

      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.id, decoded.userId));

      return reply.send({ user });
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });

  // 5. Change Password (Authenticated)
  fastify.post(
    "/change-password",
    async (
      request: FastifyRequest<{
        Body: { currentPassword: string; newPassword: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { userId } = request.user as { userId: string };
      const { currentPassword, newPassword } = request.body || {};
      if (!currentPassword || !newPassword || newPassword.length < 8) {
        return reply
          .status(400)
          .send({ error: "New password must be at least 8 characters long." });
      }
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.passwordHash) {
        return reply.status(400).send({
          error:
            "Cannot change password: user does not have a local password set.",
        });
      }
      // Verify current password (user.passwordHash is now guaranteed string)
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return reply.status(400).send({ error: "Incorrect current password." });
      }
      // Hash and store new password
      const newHash = await bcrypt.hash(newPassword, 12);
      await db
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return reply.send({
        success: true,
        message: "Password updated successfully.",
      });
    },
  );

  // 6. Update Profile Name / Info (Authenticated)
  fastify.patch(
    "/profile",
    async (
      request: FastifyRequest<{ Body: { name?: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { userId } = request.user as { userId: string };
      const { name } = request.body || {};
      if (!name || !name.trim()) {
        return reply.status(400).send({ error: "Name cannot be empty." });
      }
      await db
        .update(users)
        .set({ name: name.trim(), updatedAt: new Date() })
        .where(eq(users.id, userId));
      return reply.send({ success: true, message: "Profile updated." });
    },
  );

  // 7. Revoke Other Sessions (Authenticated)
  fastify.post(
    "/revoke-other-sessions",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { userId, sessionToken } = request.user as {
        userId: string;
        sessionToken?: string;
      };

      if (sessionToken) {
        await db
          .delete(userSessions)
          .where(
            and(
              eq(userSessions.userId, userId),
              ne(userSessions.token, sessionToken),
            ),
          );

        // Immediately notify and disconnect all other active WebSocket sessions
        socketManager.revokeOtherSessions(userId, sessionToken);
      }
      return reply.send({
        success: true,
        message: "All other sessions revoked successfully.",
      });
    },
  );

  // 8. Delete Account (Authenticated - Cascades to all user data)
  fastify.delete(
    "/account",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { userId } = request.user as { userId: string };

      // Optional user preference: deleteCloudFiles
      const body = request.body as { deleteCloudFiles?: boolean } | undefined;
      const query = request.query as { deleteCloudFiles?: string } | undefined;
      const deleteCloudFiles =
        body?.deleteCloudFiles === true || query?.deleteCloudFiles === "true";

      // 1. Purge thumbnails and (optionally) cloud files from providers before DB cascade
      try {
        await VfsService.purgeAllUserData(userId, deleteCloudFiles);
      } catch (purgeErr) {
        request.log.error(
          purgeErr,
          `Failed to complete cloud files purge for user ${userId}`,
        );
      }

      // 2. Immediately notify and disconnect all active user sockets
      socketManager.broadcastToUser(userId, {
        type: "SESSION_REVOKED",
        payload: { reason: "Account permanently deleted" },
      });

      // 3. Deleting user cascades to sessions, identities, vfs_nodes, and chunks
      await db.delete(users).where(eq(users.id, userId));

      reply.clearCookie(COOKIE_NAME, {
        path: "/",
        domain: getCookieDomain(request),
      });
      return reply.send({
        success: true,
        message: deleteCloudFiles
          ? "Your Fuze account, files, and connected cloud data have been permanently deleted."
          : "Your Fuze account and indexing data have been permanently deleted. Your files remain stored in your personal cloud accounts.",
      });
    },
  );

  // 9. List Active Sessions (Authenticated)
  fastify.get(
    "/sessions",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { userId, sessionToken } = request.user as {
        userId: string;
        sessionToken?: string;
      };

      const now = new Date();
      const sessions = await db
        .select({
          id: userSessions.id,
          userAgent: userSessions.userAgent,
          createdAt: userSessions.createdAt,
          expiresAt: userSessions.expiresAt,
          token: userSessions.token,
        })
        .from(userSessions)
        .where(
          and(
            eq(userSessions.userId, userId),
            gt(userSessions.expiresAt, now),
          ),
        );

      const items = sessions.map((s) => {
        let browser = "Web Browser";
        let os = "Desktop Device";
        const ua = s.userAgent || "";

        if (/iPhone/i.test(ua)) os = "iPhone (iOS)";
        else if (/iPad/i.test(ua)) os = "iPad (iPadOS)";
        else if (/Android/i.test(ua)) os = "Android Device";
        else if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
        else if (/Windows/i.test(ua)) os = "Windows PC";
        else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
        else if (/Linux/i.test(ua)) os = "Linux";

        if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
        else if (/Chrome\//i.test(ua)) browser = "Google Chrome";
        else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Apple Safari";
        else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";

        return {
          id: s.id,
          device: `${browser} on ${os}`,
          userAgent: s.userAgent,
          createdAt: s.createdAt,
          isCurrent: s.token === sessionToken,
        };
      });

      return reply.send({ sessions: items });
    },
  );

  // 10. Revoke Specific Session (Authenticated)
  fastify.delete(
    "/sessions/:sessionId",
    async (
      request: FastifyRequest<{ Params: { sessionId: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { userId, sessionToken } = request.user as {
        userId: string;
        sessionToken?: string;
      };
      const { sessionId } = request.params;

      const [targetSession] = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.id, sessionId),
            eq(userSessions.userId, userId),
          ),
        );

      if (!targetSession) {
        return reply.status(404).send({ error: "Session not found." });
      }

      await db
        .delete(userSessions)
        .where(
          and(
            eq(userSessions.id, sessionId),
            eq(userSessions.userId, userId),
          ),
        );

      // Immediately notify and disconnect the revoked socket session
      if (targetSession.token) {
        socketManager.revokeSession(targetSession.token);
      }

      if (targetSession.token === sessionToken) {
        reply.clearCookie(COOKIE_NAME, {
          path: "/",
          domain: getCookieDomain(request),
        });
      }

      return reply.send({ success: true, message: "Session revoked successfully." });
    },
  );
}
