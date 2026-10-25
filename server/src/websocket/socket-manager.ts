import { WebSocket } from "ws";
import IORedis from "ioredis";

export type SyncEventType =
  | "FILE_CREATED"
  | "FILE_DELETED"
  | "FILE_RENAMED"
  | "QUOTA_UPDATED"
  | "UPLOAD_PROGRESS"
  | "PROVIDER_CONNECTED"
  | "PROVIDER_DISCONNECTED"
  | "PROVIDER_CLEANUP_PROGRESS"
  | "PROVIDER_MIGRATION_FAILED"
  | "PROVIDER_MIGRATION_CANCELLED"
  | "FILES_UPDATED"
  | "SESSION_REVOKED"
  | "PROVIDER_STATUS_CHANGED";

export interface SyncEvent {
  type: SyncEventType;
  payload: any;
}

const REDIS_CHANNEL = "fuze:ws:events";

class SocketManager {
  private userSockets = new Map<string, Set<WebSocket>>();
  private sessionSockets = new Map<string, WebSocket>();
  private pub: IORedis | null = null;
  private sub: IORedis | null = null;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    try {
      this.pub = new IORedis(redisUrl);
      this.sub = new IORedis(redisUrl);

      this.pub.on("error", (err) => {
        console.warn(`[Redis:SocketPub] Warning: ${err?.message || err}`);
      });
      this.sub.on("error", (err) => {
        console.warn(`[Redis:SocketSub] Warning: ${err?.message || err}`);
      });

      this.sub.on("ready", () => {
        this.sub
          ?.subscribe(REDIS_CHANNEL)
          .then(() => {
            console.log(`[Redis:SocketSub] Successfully subscribed to ${REDIS_CHANNEL}`);
          })
          .catch((err) => {
            console.warn(
              `[Redis:SocketSub] Could not subscribe to ${REDIS_CHANNEL}: ${err?.message || err}`,
            );
          });
      });

      this.sub.on("message", (channel, message) => {
        if (channel !== REDIS_CHANNEL) return;
        try {
          const data = JSON.parse(message);
          if (data.type === "BROADCAST_USER") {
            this.localBroadcastToUser(data.userId, data.event);
          } else if (data.type === "REVOKE_SESSION") {
            this.localRevokeSession(data.sessionToken);
          } else if (data.type === "REVOKE_OTHER_SESSIONS") {
            this.localRevokeOtherSessions(
              data.userId,
              data.currentSessionToken,
            );
          }
        } catch {}
      });
    } catch (err: any) {
      console.warn(`[Redis:SocketManager] Init warning: ${err?.message || err}`);
    }
  }

  register(userId: string, socket: WebSocket, sessionToken?: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    const sockets = this.userSockets.get(userId)!;
    sockets.add(socket);

    if (sessionToken) {
      this.sessionSockets.set(sessionToken, socket);
    }

    let isAlive = true;
    socket.on("pong", () => {
      isAlive = true;
    });

    const interval = setInterval(() => {
      if (!isAlive) {
        socket.terminate();
        clearInterval(interval);
        return;
      }
      isAlive = false;
      socket.ping();
    }, 30000);

    socket.on("close", () => {
      clearInterval(interval);
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
      if (sessionToken) {
        this.sessionSockets.delete(sessionToken);
      }
    });
  }

  private localBroadcastToUser(userId: string, event: SyncEvent) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    const data = JSON.stringify(event);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    }
  }

  broadcastToUser(userId: string, event: SyncEvent) {
    // 1. Send locally if user socket is connected to this process
    this.localBroadcastToUser(userId, event);
    // 2. Publish to Redis so all PM2 worker/api processes receive and forward it
    if (this.pub) {
      this.pub
        .publish(
          REDIS_CHANNEL,
          JSON.stringify({
            type: "BROADCAST_USER",
            userId,
            event,
          }),
        )
        .catch(() => {});
    }
  }

  private localRevokeSession(sessionToken: string) {
    const socket = this.sessionSockets.get(sessionToken);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "SESSION_REVOKED",
          payload: { reason: "Session revoked by user" },
        }),
      );
      setTimeout(() => {
        try {
          socket.close(4001, "Session Revoked");
        } catch {}
      }, 100);
      this.sessionSockets.delete(sessionToken);
    }
  }

  revokeSession(sessionToken: string) {
    this.localRevokeSession(sessionToken);
    if (this.pub) {
      this.pub
        .publish(
          REDIS_CHANNEL,
          JSON.stringify({ type: "REVOKE_SESSION", sessionToken }),
        )
        .catch(() => {});
    }
  }

  private localRevokeOtherSessions(
    userId: string,
    currentSessionToken: string,
  ) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    for (const [token, socket] of this.sessionSockets.entries()) {
      if (token !== currentSessionToken && sockets.has(socket)) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "SESSION_REVOKED",
              payload: { reason: "All other sessions revoked" },
            }),
          );
          setTimeout(() => {
            try {
              socket.close(4001, "Session Revoked");
            } catch {}
          }, 100);
        }
        this.sessionSockets.delete(token);
      }
    }
  }

  revokeOtherSessions(userId: string, currentSessionToken: string) {
    this.localRevokeOtherSessions(userId, currentSessionToken);
    if (this.pub) {
      this.pub
        .publish(
          REDIS_CHANNEL,
          JSON.stringify({
            type: "REVOKE_OTHER_SESSIONS",
            userId,
            currentSessionToken,
          }),
        )
        .catch(() => {});
    }
  }
}

export const socketManager = new SocketManager();
