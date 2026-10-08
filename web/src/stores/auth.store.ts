import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => {
    localStorage.setItem("fuze_token", token);
    localStorage.setItem("fuze_user", JSON.stringify(user));
    set({ user, token, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem("fuze_token");
    localStorage.removeItem("fuze_user");
    set({ user: null, token: null, isLoading: false });
  },
  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("fuze_token");
    const user = localStorage.getItem("fuze_user");
    if (token && user) {
      try {
        set({ user: JSON.parse(user), token, isLoading: false });
      } catch {}
    }
    set({ isLoading: false });
  },
}));
