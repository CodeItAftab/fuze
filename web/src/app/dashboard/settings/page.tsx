"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { useAuthStore } from "@/stores/auth.store";
import { useDriveStore } from "@/stores/drive.store";
import {
  User,
  Shield,
  HardDrive,
  Bell,
  AlertTriangle,
  Check,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Menu,
  Download,
  Copy,
  Mail,
  Zap,
  Lock,
  Laptop,
  CheckCircle2,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";

type SettingsTab = "general" | "storage" | "security" | "notifications" | "danger";

export default function SettingsPage() {
  const { user, setUser, logout, checkSession } = useAuthStore();
  const { providers, storageSummary, setMobileSidebarOpen } = useDriveStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const [prevUser, setPrevUser] = useState(user);
  const [name, setName] = useState(user?.name || "");

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (user !== prevUser) {
    setPrevUser(user);
    if (user?.name) setName(user.name);
  }

  // Profile State
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Verification Resend State
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState<string | null>(null);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState(false);

  // Password State
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

  // Storage Preferences (Persisted in localStorage)
  const [allocationStrategy, setAllocationStrategy] = useState<string>("balanced");
  const [concurrencyLimit, setConcurrencyLimit] = useState<number>(4);
  const [autoDeduplication, setAutoDeduplication] = useState<boolean>(true);

  // Notification Preferences (Persisted in localStorage)
  const [quotaWarningThreshold, setQuotaWarningThreshold] = useState<number>(85);
  const [tokenAlerts, setTokenAlerts] = useState<boolean>(true);
  const [uploadSound, setUploadSound] = useState<boolean>(true);
  const [desktopAlerts, setDesktopAlerts] = useState<boolean>(false);

  // Session Revocation
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);

  // Export Manifest
  const [isExporting, setIsExporting] = useState(false);

  // Danger Zone - Account Deletion Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStrategy = localStorage.getItem("fuze_pref_strategy");
      if (savedStrategy) setAllocationStrategy(savedStrategy);

      const savedConcurrency = localStorage.getItem("fuze_pref_concurrency");
      if (savedConcurrency) setConcurrencyLimit(Number(savedConcurrency));

      const savedDeduplication = localStorage.getItem("fuze_pref_dedup");
      if (savedDeduplication !== null) setAutoDeduplication(savedDeduplication === "true");

      const savedQuota = localStorage.getItem("fuze_pref_quota_warn");
      if (savedQuota) setQuotaWarningThreshold(Number(savedQuota));

      const savedSound = localStorage.getItem("fuze_pref_sound");
      if (savedSound !== null) setUploadSound(savedSound === "true");

      const savedDesktop = localStorage.getItem("fuze_pref_desktop_notify");
      if (savedDesktop !== null) setDesktopAlerts(savedDesktop === "true");
    }
  }, []);

  const saveStrategy = (val: string) => {
    setAllocationStrategy(val);
    if (typeof window !== "undefined") localStorage.setItem("fuze_pref_strategy", val);
  };

  const saveConcurrency = (val: number) => {
    setConcurrencyLimit(val);
    if (typeof window !== "undefined") localStorage.setItem("fuze_pref_concurrency", String(val));
  };

  const saveDeduplication = (val: boolean) => {
    setAutoDeduplication(val);
    if (typeof window !== "undefined") localStorage.setItem("fuze_pref_dedup", String(val));
  };

  const saveQuotaThreshold = (val: number) => {
    setQuotaWarningThreshold(val);
    if (typeof window !== "undefined") localStorage.setItem("fuze_pref_quota_warn", String(val));
  };

  const saveUploadSound = (val: boolean) => {
    setUploadSound(val);
    if (typeof window !== "undefined") localStorage.setItem("fuze_pref_sound", String(val));
  };

  const saveDesktopAlerts = async (val: boolean) => {
    setDesktopAlerts(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("fuze_pref_desktop_notify", String(val));
      if (val && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  };

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
      setProfileMsg({ type: "success", text: "Profile details updated successfully." });
      setTimeout(() => setProfileMsg(null), 3500);
    } catch (err: unknown) {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving name",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResendingVerification(true);
    setVerificationMsg(null);

    try {
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      setVerificationMsg("Verification email sent! Check your inbox.");
      setTimeout(() => setVerificationMsg(null), 4000);
    } catch (err: unknown) {
      setVerificationMsg(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleCopyAccountId = () => {
    if (!user?.id) return;
    void navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
      setTimeout(() => setPasswordMsg(null), 3500);
    } catch (err: unknown) {
      setPasswordMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error updating password",
      });
    } finally {
      setIsChangingPassword(false);
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
      setSessionMsg("All other browser sessions have been logged out.");
      setTimeout(() => setSessionMsg(null), 4000);
    } catch (err: unknown) {
      setSessionMsg(err instanceof Error ? err.message : "Error revoking sessions.");
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleExportManifest = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${apiUrl}/files?recursive=true`, {
        credentials: "include",
      });
      const data = await res.json();

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
        },
        storageSummary: {
          totalPoolBytes: storageSummary.totalPoolBytes,
          usedPoolBytes: storageSummary.usedPoolBytes,
          connectedProviders: providers.map((p) => ({
            id: p.id,
            provider: p.provider,
            accountEmail: p.accountEmail,
            quotaTotal: p.quotaTotal,
            quotaUsed: p.quotaUsed,
          })),
        },
        virtualFileSystem: data.nodes || data.files || [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fuze-vfs-manifest-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to export data manifest");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
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

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
    return `${bytes} B`;
  };

  const tabs = [
    { id: "general", label: "General", icon: User },
    { id: "storage", label: "Storage & Pooling", icon: HardDrive },
    { id: "security", label: "Security & Sessions", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ] as const;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 shrink-0">
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
                <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                  Manage your personal account, storage pool preferences, security, and data.
                </p>
              </div>
            </div>
          </div>

          {/* SaaS Tab Navigation Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-100 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDanger = tab.id === "danger";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isActive
                      ? isDanger
                        ? "bg-rose-50 text-rose-700 font-semibold"
                        : "bg-blue-50 text-blue-700 font-semibold shadow-2xs"
                      : isDanger
                      ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50/50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? isDanger
                          ? "text-rose-600"
                          : "text-blue-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: GENERAL (PROFILE & ACCOUNT) */}
          {activeTab === "general" && (
            <div className="space-y-6 max-w-3xl">
              {/* Account Identity Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-blue-500/10 shrink-0">
                      {getInitials(user?.name || "User")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900">
                          {user?.name || "Fuze Member"}
                        </h2>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                          Personal Free
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user?.emailVerified === true ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Email Verified</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                      >
                        {isResendingVerification ? (
                          <Loader2 className="h-3 w-3 animate-spin text-amber-700" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span>Verify Email Now</span>
                      </button>
                    )}
                  </div>
                </div>

                {verificationMsg && (
                  <div className="mt-3 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                    {verificationMsg}
                  </div>
                )}

                {/* Account Details Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1 font-medium">
                      Account ID
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px]">
                        {user?.id ? `${user.id.slice(0, 18)}...` : "Loading..."}
                      </code>
                      <button
                        onClick={handleCopyAccountId}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Copy full Account ID"
                      >
                        {copiedId ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1 font-medium">
                      Active Storage Pool
                    </span>
                    <span className="font-semibold text-slate-800">
                      {providers.length} Connected Drive{providers.length === 1 ? "" : "s"} (
                      {formatBytes(storageSummary.totalPoolBytes)} total)
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Profile Form */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 pb-2 border-b border-slate-100">
                  Profile Details
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
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
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Primary email address
                    </label>
                    <input
                      type="email"
                      disabled
                      autoComplete="email"
                      value={user?.email || ""}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed select-none"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Used for session authentication, security notifications, and recovery.
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
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: STORAGE & POOLING PREFERENCES */}
          {activeTab === "storage" && (
            <div className="space-y-6 max-w-3xl">
              {/* Allocation Strategy Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Default Upload Distribution Strategy
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      How Fuze stripes and distributes file chunks across your connected drives.
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      id: "balanced",
                      name: "Balanced Distribution (Recommended)",
                      desc: "Stripes chunks proportionally across all connected providers based on available capacity. Ensures balanced wear and maximized aggregate throughput.",
                      badge: "Optimal",
                    },
                    {
                      id: "largest_first",
                      name: "Fill Largest Capacity Drive First",
                      desc: "Directs chunks to the cloud provider with the most free storage space until filled before moving to smaller drives.",
                      badge: "Sequential",
                    },
                    {
                      id: "priority",
                      name: "Provider Priority Hierarchy",
                      desc: "Prioritizes providers in fixed hierarchy: Google Drive → Microsoft OneDrive → Box → Dropbox.",
                      badge: "Ordered",
                    },
                  ].map((strat) => {
                    const isSelected = allocationStrategy === strat.id;
                    return (
                      <div
                        key={strat.id}
                        onClick={() => saveStrategy(strat.id)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/30 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900">
                              {strat.name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {strat.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {strat.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transfer Concurrency & Zero-Proxy Streaming Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
                  Transfer Pipeline & Cryptography
                </h3>

                {/* Concurrency Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        Parallel Upload Streams
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Number of file chunks uploaded simultaneously in parallel.
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 font-mono">
                      {concurrencyLimit}x Parallel
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 2, label: "2 Streams (Standard)" },
                      { val: 4, label: "4 Streams (Recommended)" },
                      { val: 8, label: "8 Streams (High Speed)" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => saveConcurrency(opt.val)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                          concurrencyLimit === opt.val
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Automatic SHA-256 Deduplication Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Content-Addressed Deduplication
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Calculates client-side SHA-256 chunk hashes to skip uploading identical data, saving pooled drive space.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveDeduplication(!autoDeduplication)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoDeduplication ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        autoDeduplication ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Zero-Proxy Streaming Badge */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <Zap className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-900 block mb-0.5">
                      Direct Zero-Proxy Browser Transfers
                    </strong>
                    All file uploads and downloads stream directly between your browser and cloud provider storage buckets via pre-signed URLs. Fuze servers never proxy or inspect your file payload.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & SESSIONS */}
          {activeTab === "security" && (
            <div className="space-y-6 max-w-3xl">
              {/* Password Management */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 pb-2 border-b border-slate-100">
                  Update Account Password
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Current password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        required
                        autoComplete="current-password"
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
                        minLength={8}
                        autoComplete="new-password"
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
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
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
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      {isChangingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Sessions & Devices */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Active Device Session
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Manage browser devices currently connected to your Fuze account.
                    </p>
                  </div>
                  <Laptop className="h-4 w-4 text-slate-400" />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Laptop className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Current Web Browser
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Now
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Authenticated via signed HttpOnly session token
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      void logout();
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white rounded-lg text-xs font-medium text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5 text-slate-500" />
                    <span>Log Out</span>
                  </button>
                </div>

                {sessionMsg && (
                  <div className="mb-3 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                    {sessionMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRevokeOtherSessions}
                  disabled={isRevokingSessions}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  {isRevokingSessions ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>Sign out of all other devices</span>
                </button>
              </div>

              {/* End-to-End Cryptography Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Cryptographic Safeguards & Tokens
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Envelope Encryption & Zero-Knowledge Protocol
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold block text-slate-800 text-[11px] mb-1">
                      OAuth Refresh Tokens
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Encrypted at rest using AES-256-CBC cipher with SHA-256 key derivation.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold block text-slate-800 text-[11px] mb-1">
                      Virtual File Chunks
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Individual chunk segments are verified with SHA-256 hashes to prevent corruption.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS & PREFERENCES */}
          {activeTab === "notifications" && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
                  Storage & Transfer Alerts
                </h3>

                {/* Quota Threshold Warning */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Low Storage Capacity Alert
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Display warning when pooled drive capacity crosses the selected threshold.
                    </span>
                  </div>
                  <select
                    value={quotaWarningThreshold}
                    onChange={(e) => saveQuotaThreshold(Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value={80}>Warn at 80% used</option>
                    <option value={85}>Warn at 85% used</option>
                    <option value={90}>Warn at 90% used</option>
                    <option value={95}>Warn at 95% used</option>
                  </select>
                </div>

                {/* Provider Token Health */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Provider Disconnection & Token Expiry Alerts
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Receive in-app alerts if a linked cloud account (Dropbox, Google Drive) requires re-authentication.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTokenAlerts(!tokenAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      tokenAlerts ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        tokenAlerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Sound on Upload Complete */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Audio Chime on Upload Completion
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Plays a subtle completion sound when large batch uploads finish.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveUploadSound(!uploadSound)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      uploadSound ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        uploadSound ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Desktop Notifications */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Desktop Browser Push Notifications
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Show native system notifications when uploads complete while Fuze is in background.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveDesktopAlerts(!desktopAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      desktopAlerts ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        desktopAlerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DANGER ZONE & DATA EXPORT */}
          {activeTab === "danger" && (
            <div className="space-y-6 max-w-3xl">
              {/* Export Data Manifest Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Export Virtual File System Manifest
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Download a complete, offline JSON manifest containing your full file hierarchy, chunk IDs, and provider mappings.
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={handleExportManifest}
                  disabled={isExporting}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-blue-600" />
                  )}
                  <span>Export JSON Manifest</span>
                </button>
              </div>

              {/* Danger Zone Container */}
              <div className="bg-rose-50/40 rounded-2xl border border-rose-200 shadow-2xs p-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                    Danger Zone
                  </h3>
                </div>
                <p className="text-xs text-rose-800/80 mb-5 leading-relaxed">
                  Permanently delete your Fuze account, Virtual File System hierarchy, metadata, and disconnect all pooled storage provider tokens. This action is irreversible.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmationText("");
                    setDeleteError(null);
                    setShowDeleteModal(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Fuze Account</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Account & Data
                </h3>
                <span className="text-[11px] text-rose-600 font-medium">
                  This action cannot be undone.
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              All your virtual folder trees, file records, and connected provider links will be permanently deleted from Fuze servers.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Type <strong className="text-rose-600">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                autoFocus
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
              {deleteError && (
                <p className="text-xs text-rose-600 mt-1.5">{deleteError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  isDeletingAccount ||
                  deleteConfirmationText.trim().toUpperCase() !== "DELETE"
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {isDeletingAccount && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
