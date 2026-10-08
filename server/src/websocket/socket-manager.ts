import { WebSocket } from "ws";

export interface SyncEvent {
  type:
    | "FILE_CREATED"
    | "FILE_DELETED"
    | "FILE_RENAMED"
    | "QUOTA_UPDATED"
    | "UPLOAD_PROGRESS";
  payload: any;
}

class SocketManager {
  private userSockets = new Map<string, Set<WebSocket>>();

  register(userId: string, socket: WebSocket) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    const sockets = this.userSockets.get(userId)!;
    sockets.add(socket);

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
}

export const socketManager = new SocketManager();
