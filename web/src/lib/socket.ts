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
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (typeof window === "undefined") return;
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // 1. Guard against connecting on public / auth / preview routes
    const pathname = window.location.pathname;
    const isPublicOrAuth =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/verify-email") ||
      pathname.startsWith("/share") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/privacy") ||
      pathname === "/";

    if (isPublicOrAuth) {
      this.disconnect();
      return;
    }

    // 2. Guard against connecting without an active session or token
    const token = localStorage.getItem("fuze_token");
    const hasSessionCookie = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("fuze_session="));
    const user = useAuthStore.getState().user;

    if (!token && !hasSessionCookie && !user) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";
    let wsUrl = baseWsUrl;
    if (token) {
      try {
        const url = new URL(baseWsUrl, window.location.origin);
        url.searchParams.set("token", token);
        wsUrl = url.toString();
      } catch {
        wsUrl = baseWsUrl;
      }
    }

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (err) {
      console.error("Failed to construct WebSocket:", err);
      return;
    }

    this.socket.onopen = () => {
      console.log("⚡ WebSocket connection established, validating credentials...");
      // NOTE: Do not reset reconnectAttempts here.
      // Reset only once the server confirms auth via { type: "CONNECTED" }.
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CONNECTED") {
          this.reconnectAttempts = 0;
          console.log("⚡ Connected to Fuze Real-Time WebSocket");
        }
        this.handleEvent(data);
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    this.socket.onclose = (event) => {
      const isAuthFailure =
        event.code === 1008 ||
        event.code === 4001 ||
        event.reason === "Unauthorized" ||
        event.reason === "Invalid Token" ||
        event.reason === "Session Revoked";

      if (isAuthFailure) {
        console.warn(
          `🔒 WebSocket closed due to auth failure (${event.code}: ${event.reason || "Unauthorized"}) - Halting reconnection.`,
        );
        this.disconnect();

        if (event.code === 4001 || event.reason === "Session Revoked") {
          useAuthStore.getState().clearAuth();
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login")
          ) {
            window.location.href = "/login?revoked=true";
          }
        }
        return;
      }

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(
          `🔄 WebSocket disconnected (Code: ${event.code}). Retrying in ${
            (this.reconnectDelay * this.reconnectAttempts) / 1000
          }s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
        );
        this.reconnectTimer = setTimeout(
          () => this.connect(),
          this.reconnectDelay * this.reconnectAttempts,
        );
      } else {
        console.warn("⚠️ WebSocket max reconnect attempts reached. Giving up.");
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

      case "FILE_RENAMED":
        if (data.payload && typeof data.payload === "object" && "id" in data.payload) {
          const updated = data.payload as Partial<VfsItem> & { id: string };
          store.addItem(updated as VfsItem);
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

      case "PROVIDER_CONNECTED":
      case "PROVIDER_STATUS_CHANGED":
      case "QUOTA_UPDATED":
        void store.refreshProviders();
        break;

      case "PROVIDER_CLEANUP_PROGRESS":
        if (data.payload && typeof data.payload === "object") {
          store.setMigrationProgress(data.payload as MigrationProgress);
        }
        break;

      case "PROVIDER_DISCONNECTED":
      case "PROVIDER_MIGRATION_FAILED":
        store.setMigrationProgress(null);
        void store.refreshProviders();
        break;
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }
}

export const socketClient = new WebSocketClient();
