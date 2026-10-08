import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db, providerIdentities } from "../db/index.js";
import { eq } from "drizzle-orm";

export async function providerRoutes(fastify: FastifyInstance) {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
    },
  );

  // List user's connected providers and total pool statistics
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
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

    const totalPool = items.reduce((sum, p) => sum + p.quotaTotal, 0);
    const usedPool = items.reduce((sum, p) => sum + p.quotaUsed, 0);

    return reply.send({
      providers: items,
      summary: {
        totalPoolBytes: totalPool,
        usedPoolBytes: usedPool,
        freePoolBytes: Math.max(0, totalPool - usedPool),
      },
    });
  });
}
