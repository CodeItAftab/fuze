import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

let checkSessionPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  setAuth: (user) => set({ user, isLoading: false }),
  clearAuth: () => set({ user: null, isLoading: false }),
  logout: async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token =
      typeof window !== "undefined" ? localStorage.getItem("fuze_token") : null;

    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}

    if (typeof window !== "undefined") {
      localStorage.removeItem("fuze_token");
      document.cookie = "fuze_session=; path=/; max-age=0; SameSite=Lax; Secure";
    }

    set({ user: null, isLoading: false });
    if (typeof window !== "undefined") {
      // Full page redirect ensures all in-memory client state and sockets are torn down
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  },

  checkSession: async () => {
    if (checkSessionPromise) return checkSessionPromise;

    checkSessionPromise = (async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("fuze_token")
          : null;

      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${apiUrl}/auth/me`, {
          credentials: "include",
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          set({ user: data.user, isLoading: false });
        } else {
          set({ user: null, isLoading: false });
          if (
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/dashboard")
          ) {
            // If revoked, clean redirect to login page with notice
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href =
              res.status === 401 ? "/login?revoked=true" : "/login";
          }
        }
      } catch {
        set({ user: null, isLoading: false });
      } finally {
        checkSessionPromise = null;
      }
    })();

    return checkSessionPromise;
  },
}));
