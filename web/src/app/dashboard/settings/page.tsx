"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { SessionsSection, SessionItem } from "@/components/settings/SessionsSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";
import { useAuthStore } from "@/stores/auth.store";
import { useDriveStore } from "@/stores/drive.store";
import { Menu } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser, logout, checkSession } = useAuthStore();
  const { setMobileSidebarOpen } = useDriveStore();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteCloudFiles, setDeleteCloudFiles] = useState(false);
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
    void checkSession();
    void fetchSessions();
  }, [checkSession]);

  const handleUpdateProfile = async (name: string) => {
    try {
      const res = await fetch(`${apiUrl}/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      if (user) setUser({ ...user, name });
      void checkSession();
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error updating name.",
      };
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return { success: false, error: "No email registered." };
    try {
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      return {
        success: true,
        message: "Verification email sent! Check your inbox.",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send verification email.",
      };
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error changing password.",
      };
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteCloudFiles }),
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
              <p className="text-xs text-slate-500">
                Manage your account credentials, security preferences, and active devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-6">
            <div className="h-12 w-12 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
              {getInitials(user?.name || "User")}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {user?.name || "User"}
              </h2>
              <span className="text-xs text-slate-500 truncate block">
                {user?.email || ""}
              </span>
            </div>
          </div>

          <div className="space-y-6 max-w-4xl">
            <ProfileSection
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onResendVerification={handleResendVerification}
            />

            <PasswordSection onChangePassword={handleChangePassword} />

            <SessionsSection
              sessions={sessions}
              isLoading={isLoadingSessions}
              revokingSessionId={revokingSessionId}
              isRevokingAll={isRevokingSessions}
              sessionMsg={sessionMsg}
              onClearSessionMsg={() => setSessionMsg(null)}
              onRevokeSession={handleRevokeSession}
              onRevokeOtherSessions={handleRevokeOtherSessions}
              onSignOut={() => void logout()}
            />

            <DangerZoneSection
              onOpenDeleteModal={() => {
                setDeleteConfirmation("");
                setDeleteError(null);
                setDeleteCloudFiles(false);
                setShowDeleteModal(true);
              }}
            />
          </div>
        </main>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        deleteConfirmation={deleteConfirmation}
        deleteCloudFiles={deleteCloudFiles}
        isDeleting={isDeletingAccount}
        deleteError={deleteError}
        onConfirmationChange={setDeleteConfirmation}
        onDeleteCloudFilesChange={setDeleteCloudFiles}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteAccount}
      />
    </div>
  );
}
