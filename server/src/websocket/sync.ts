import { FastifyInstance } from "fastify";
import { socketManager } from "./socket-manager.js";

const COOKIE_NAME = "fuze_session";

export async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get("/ws", { websocket: true }, (socket, req) => {
    let jwtToken: string | undefined;

    // 1. Mobile app query param: /ws?token=...
    const query = req.query as { token?: string };
    if (query?.token) {
      jwtToken = query.token;
    }

    // 2. Web app signed HttpOnly cookie
    if (!jwtToken && req.cookies[COOKIE_NAME]) {
      const unsigned = req.unsignCookie(req.cookies[COOKIE_NAME]);
      if (unsigned.valid && unsigned.value) {
        jwtToken = unsigned.value;
      }
    }

    if (!jwtToken) {
      socket.send(JSON.stringify({ error: "Unauthorized" }));
      socket.close(1008, "Unauthorized");
      return;
    }

    try {
      const decoded = fastify.jwt.verify<{ userId: string }>(jwtToken);
      socketManager.register(decoded.userId, socket);

      socket.send(
        JSON.stringify({
          type: "CONNECTED",
          userId: decoded.userId,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch {
      socket.send(JSON.stringify({ error: "Invalid Token" }));
      socket.close(1008, "Invalid Token");
    }
  });
}
