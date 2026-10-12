"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { useAuthStore } from "@/stores/auth.store";
import { useDriveStore } from "@/stores/drive.store";
import {
  Check,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Menu,
  Mail,
  Shield,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface SessionItem {
  id: string;
  device: string;
  userAgent?: string;
  createdAt: string;
  isCurrent: boolean;
}

export default function SettingsPage() {
  const { user, setUser, logout, checkSession } = useAuthStore();
  const { setMobileSidebarOpen } = useDriveStore();

  const [name, setName] = useState(user?.name || "");

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  // Profile Update
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Verification Resend
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Active Sessions & Devices Management
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch(`${apiUrl}/auth/sessions`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, []);

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
      setProfileMsg({ type: "success", text: "Name updated successfully." });
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: unknown) {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error updating name.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResending(true);
    setResendMsg(null);
    try {
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      setResendMsg("Verification email sent! Check your inbox.");
      setTimeout(() => setResendMsg(null), 4000);
    } catch (err: unknown) {
      setResendMsg(err instanceof Error ? err.message : "Failed to send verification email.");
    } finally {
      setIsResending(false);
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
        text: "New password must be at least 8 characters.",
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
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setPasswordMsg({
        type: "success",
        text: "Password updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (err: unknown) {
      setPasswordMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error changing password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    setSessionMsg(null);
    try {
      const res = await fetch(`${apiUrl}/auth/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke session");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSessionMsg({
        type: "success",
        text: "Device session revoked successfully.",
      });
      setTimeout(() => setSessionMsg(null), 3500);
    } catch (err: unknown) {
      setSessionMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error revoking session.",
      });
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setIsRevokingSessions(true);
    setSessionMsg(null);
    try {
      const res = await fetch(`${apiUrl}/auth/revoke-other-sessions`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke sessions");
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setSessionMsg({
        type: "success",
        text: "All other device sessions have been logged out.",
      });
      setTimeout(() => setSessionMsg(null), 3500);
    } catch (err: unknown) {
      setSessionMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error revoking sessions.",
      });
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const formatSessionDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getDeviceIcon = (deviceStr: string, uaStr?: string) => {
    const combined = `${deviceStr} ${uaStr || ""}`.toLowerCase();
    if (
      combined.includes("iphone") ||
      combined.includes("ipad") ||
      combined.includes("android") ||
      combined.includes("mobile")
    ) {
      return <Smartphone className="h-4 w-4 text-slate-500 shrink-0" />;
    }
    if (
      combined.includes("windows") ||
      combined.includes("mac") ||
      combined.includes("linux")
    ) {
      return <Laptop className="h-4 w-4 text-slate-500 shrink-0" />;
    }
    return <Globe className="h-4 w-4 text-slate-500 shrink-0" />;
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm.');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${apiUrl}/auth/account`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");

      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Error deleting account.");
      setIsDeletingAccount(false);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const parts = nameStr.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-3 sm:pb-4 border-b border-slate-100 mb-5 sm:mb-6">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
                Settings
              </h1>
              <p className="text-[11px] text-slate-500 font-normal">
                Manage your profile, security, and active sessions
              </p>
            </div>
          </div>

          <div className="max-w-3xl space-y-5 pb-12">
            {/* 1. Profile Section */}
            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6">
              {/* Identity Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-2xs">
                    {getInitials(user?.name || "User")}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900 truncate">
                      {user?.name || "Fuze Member"}
                    </h2>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {user?.emailVerified === true ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="h-3 w-3" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                    >
                      {isResending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Mail className="h-3 w-3 text-amber-600" />
                      )}
                      <span>Verify Email</span>
                    </button>
                  )}
                </div>
              </div>

              {resendMsg && (
                <div className="mt-3 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                  {resendMsg}
                </div>
              )}

              {/* Edit Name Form */}
              <form onSubmit={handleUpdateProfile} className="pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed select-none"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Primary login email for your account.
                  </span>
                </div>

                {profileMsg && (
                  <p
                    className={`text-xs ${
                      profileMsg.type === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {profileMsg.text}
                  </p>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isUpdatingProfile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : profileMsg?.type === "success" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : null}
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </section>

            {/* 2. Password Security Section */}
            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-slate-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Password & Security
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Update your account sign-in password
              </p>

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-3.5 pr-10 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                {passwordMsg && (
                  <p
                    className={`text-xs ${
                      passwordMsg.type === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {passwordMsg.text}
                  </p>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isChangingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </section>

            {/* 3. Session & Devices Management Section */}
            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-slate-700" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Active Sessions & Devices
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Devices and browsers currently authenticated to your Fuze account
                  </p>
                </div>

                {sessions.some((s) => !s.isCurrent) && (
                  <button
                    type="button"
                    onClick={handleRevokeOtherSessions}
                    disabled={isRevokingSessions}
                    className="self-start sm:self-auto px-3 py-1.5 border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    {isRevokingSessions ? (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                    ) : (
                      <Lock className="h-3 w-3 text-slate-400" />
                    )}
                    <span>Revoke Other Sessions</span>
                  </button>
                )}
              </div>

              {sessionMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
                    sessionMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <span>{sessionMsg.text}</span>
                  <button
                    onClick={() => setSessionMsg(null)}
                    className="text-xs font-bold px-1 hover:opacity-75"
                  >
                    ✕
                  </button>
                </div>
              )}

              {isLoadingSessions ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-xs">Loading active sessions...</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        s.isCurrent
                          ? "border-blue-200/80 bg-blue-50/20"
                          : "border-slate-200/80 bg-white hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0 mt-0.5 sm:mt-0">
                          {getDeviceIcon(s.device, s.userAgent)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {s.device}
                            </span>
                            {s.isCurrent && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Active Now (This Device)</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {s.isCurrent
                              ? `Session started ${formatSessionDate(s.createdAt)}`
                              : `Logged in ${formatSessionDate(s.createdAt)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {s.isCurrent ? (
                          <button
                            type="button"
                            onClick={() => {
                              void logout();
                            }}
                            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <LogOut className="h-3 w-3 text-slate-500" />
                            <span>Sign Out</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(s.id)}
                            disabled={revokingSessionId === s.id}
                            className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200/70 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                          >
                            {revokingSessionId === s.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {sessions.length === 0 && (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      No active sessions recorded.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* 4. Danger Zone */}
            <section className="bg-white rounded-2xl border border-rose-200 p-4 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Danger Zone
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Permanently delete your account, virtual file system, and unlink all connected cloud drives. This action cannot be reversed.
              </p>

              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmation("");
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Delete Account
              </button>
            </section>
          </div>
        </main>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Account
                </h3>
                <span className="text-[11px] text-rose-600 font-medium">
                  Irreversible action
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              All files, folders, and linked provider accounts will be permanently removed.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Type <strong className="text-rose-600">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                autoFocus
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
              {deleteError && (
                <p className="text-xs text-rose-600 mt-1.5">{deleteError}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  isDeletingAccount ||
                  deleteConfirmation.trim().toUpperCase() !== "DELETE"
                }
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
