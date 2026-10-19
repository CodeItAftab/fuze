import { create } from "zustand";
import { ToastItem } from "@/types";

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));

export const toast = {
  success: (title: string, message?: string, duration = 4000) =>
    useToastStore
      .getState()
      .addToast({ type: "success", title, message, duration }),
  error: (title: string, message?: string, duration = 5000) =>
    useToastStore
      .getState()
      .addToast({ type: "error", title, message, duration }),
  info: (title: string, message?: string, duration = 4000) =>
    useToastStore
      .getState()
      .addToast({ type: "info", title, message, duration }),
  warning: (title: string, message?: string, duration = 4500) =>
    useToastStore
      .getState()
      .addToast({ type: "warning", title, message, duration }),
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
};
