"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
import { useAuthStore } from "@/stores/auth.store";
import { useDriveStore } from "@/stores/drive.store";
import {
  Check,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Menu,
} from "lucide-react";

export default function SettingsPage() {
  const { user, setUser, logout, checkSession } = useAuthStore();
  const { setMobileSidebarOpen } = useDriveStore();
  const [prevUser, setPrevUser] = useState(user);
  const [name, setName] = useState(user?.name || "");

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (user !== prevUser) {
    setPrevUser(user);
    if (user?.name) setName(user.name);
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Name cannot be empty." });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch(`${apiUrl}/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      if (user) setUser({ ...user, name: name.trim() });
      void checkSession();
      setProfileMsg({ type: "success", text: "Saved." });
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: unknown) {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving name",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setPasswordMsg({
        type: "success",
        text: "Password changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (err: unknown) {
      setPasswordMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error updating password",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-7xl">
          {/* Header with Integrated Mobile Menu */}
          <div className="flex items-center gap-2.5 mb-6 sm:mb-8">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Settings
            </h1>
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Profile Section */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                Profile
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed select-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Primary email address associated with your account.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isUpdatingProfile ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : profileMsg?.type === "success" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : null}
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                {profileMsg && (
                  <p
                    className={`text-xs ${
                      profileMsg.type === "success"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {profileMsg.text}
                  </p>
                )}
              </form>
            </div>

            {/* Password Section */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                Change Password
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPw ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPw ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                {passwordMsg && (
                  <p
                    className={`text-xs ${
                      passwordMsg.type === "success"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {passwordMsg.text}
                  </p>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {isChangingPassword && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Session Section */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Session
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <p className="text-xs text-slate-800 font-semibold">
                    Log out of Fuze
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Terminates your current browser session.
                  </p>
                </div>
                <button
                  onClick={() => {
                    void logout();
                  }}
                  className="px-3.5 py-2 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
