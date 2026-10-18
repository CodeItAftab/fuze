import { WebSocket } from "ws";

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
  | "SESSION_REVOKED"
  | "PROVIDER_STATUS_CHANGED";

export interface SyncEvent {
  type: SyncEventType;
  payload: any;
}

class SocketManager {
  private userSockets = new Map<string, Set<WebSocket>>();
  private sessionSockets = new Map<string, WebSocket>();

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

  broadcastToUser(userId: string, event: SyncEvent) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    const data = JSON.stringify(event);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    }
  }

  revokeSession(sessionToken: string) {
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

  revokeOtherSessions(userId: string, currentSessionToken: string) {
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
}

export const socketManager = new SocketManager();
