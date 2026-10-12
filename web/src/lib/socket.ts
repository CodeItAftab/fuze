import { useDriveStore, VfsItem, MigrationProgress } from "@/stores/drive.store";
import { useAuthStore } from "@/stores/auth.store";

export interface WebSocketEventMessage {
  type: string;
  payload?: unknown;
}

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  connect() {
    if (typeof window === "undefined") return;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      console.log("⚡ Connected to Fuze Real-Time WebSocket");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleEvent(data);
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    this.socket.onclose = (event) => {
      if (event.code === 4001 || event.reason === "Session Revoked") {
        console.warn("⚠️ WebSocket closed due to remote session revocation");
        this.disconnect();
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?revoked=true";
        }
        return;
      }

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(
          () => this.connect(),
          this.reconnectDelay * this.reconnectAttempts,
        );
      }
    };
  }

  private handleEvent(data: WebSocketEventMessage) {
    const store = useDriveStore.getState();

    switch (data.type) {
      case "SESSION_REVOKED": {
        console.warn("⚠️ Received SESSION_REVOKED event from server");
        this.disconnect();
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?revoked=true";
        }
        break;
      }

      case "FILE_CREATED":
        if (data.payload && typeof data.payload === "object") {
          store.addItem(data.payload as VfsItem);
          void store.refreshProviders();
        }
        break;

      case "FILE_DELETED": {
        let itemId: string | null = null;
        if (typeof data.payload === "string") {
          itemId = data.payload;
        } else if (data.payload && typeof data.payload === "object" && "id" in data.payload) {
          itemId = String((data.payload as { id: string }).id);
        }
        if (itemId) {
          store.removeItem(itemId);
        }
        break;
      }

      case "QUOTA_UPDATED":
        void store.refreshProviders();
        break;

      case "PROVIDER_CLEANUP_PROGRESS":
        if (data.payload && typeof data.payload === "object") {
          store.setMigrationProgress(data.payload as MigrationProgress);
        }
        break;

      case "PROVIDER_DISCONNECTED":
        store.setMigrationProgress(null);
        void store.refreshProviders();
        break;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const socketClient = new WebSocketClient();
