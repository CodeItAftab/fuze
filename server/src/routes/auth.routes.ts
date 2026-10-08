import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db, users, userSessions } from "../db/index.js";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

const COOKIE_NAME = "fuze_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function authRoutes(fastify: FastifyInstance) {
  // 1. REGISTER
  fastify.post(
    "/register",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = registerSchema.safeParse(request.body);
      if (!parse.success) {
        return reply
          .status(400)
          .send({
            error: parse.error.errors[0]?.message || "Validation error",
          });
      }

      const { name, email, password } = parse.data;

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email));
      if (existing) {
        return reply.status(409).send({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [newUser] = await db
        .insert(users)
        .values({ name, email, passwordHash })
        .returning({ id: users.id, name: users.name, email: users.email });

      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await db.insert(userSessions).values({
        userId: newUser!.id,
        token: sessionToken,
        userAgent: request.headers["user-agent"] || "Unknown Device",
        expiresAt,
      });

      const jwtToken = fastify.jwt.sign(
        { userId: newUser!.id, sessionToken },
        { expiresIn: "7d" },
      );

      reply.setCookie(COOKIE_NAME, jwtToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        signed: true,
      });

      return reply.status(201).send({ user: newUser, token: jwtToken });
    },
  );

  // 2. LOGIN
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
        sameSite: "lax",
        expires: expiresAt,
        signed: true,
      });

      return reply.send({
        user: { id: user.id, name: user.name, email: user.email },
        token: jwtToken,
      });
    },
  );

  // 3. LOGOUT
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
      reply.clearCookie(COOKIE_NAME, { path: "/" });
      return reply.send({ message: "Logged out" });
    },
  );

  // 4. ME
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

      if (!session) return reply.status(401).send({ error: "Session revoked" });

      const [user] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, decoded.userId));

      return reply.send({ user });
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });
}
