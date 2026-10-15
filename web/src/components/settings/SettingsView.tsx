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

export function SettingsView() {
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

  const handleUpdateProfile = async (name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${apiUrl}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Failed to update profile" };
      if (user) {
        setUser({ ...user, name });
      }
      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred." };
    }
  };

  const handleResendVerification = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Failed to resend email" };
      return { success: true, message: data.message || "Verification email sent!" };
    } catch {
      return { success: false, error: "Network error occurred." };
    }
  };

  const handleChangePassword = async (
    currentPw: string,
    newPw: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Failed to update password" };
      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred." };
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
      if (res.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        setSessionMsg({ type: "success", text: "Session terminated successfully." });
      } else {
        const data = await res.json();
        setSessionMsg({ type: "error", text: data.error || "Failed to revoke session." });
      }
    } catch {
      setSessionMsg({ type: "error", text: "Network error occurred." });
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm("Are you sure you want to log out all other devices?")) return;
    setIsRevokingSessions(true);
    setSessionMsg(null);
    try {
      const res = await fetch(`${apiUrl}/auth/sessions`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSessions(sessions.filter((s) => s.isCurrent));
        setSessionMsg({ type: "success", text: "All other sessions revoked." });
      } else {
        const data = await res.json();
        setSessionMsg({ type: "error", text: data.error || "Failed to revoke sessions." });
      }
    } catch {
      setSessionMsg({ type: "error", text: "Network error occurred." });
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${apiUrl}/auth/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deleteCloudFiles }),
      });
      if (res.ok) {
        logout();
        window.location.href = "/";
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account.");
      }
    } catch {
      setDeleteError("Network error occurred.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />

        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold text-sm text-slate-900">Settings</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 w-full">
          <div className="max-w-3xl xl:max-w-4xl space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Account Settings
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage your personal profile, credentials, and active sessions.
              </p>
            </div>

            <ProfileSection
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onResendVerification={handleResendVerification}
            />

            <PasswordSection
              onChangePassword={handleChangePassword}
            />

            <SessionsSection
              sessions={sessions}
              isLoading={isLoadingSessions}
              revokingSessionId={revokingSessionId}
              isRevokingAll={isRevokingSessions}
              sessionMsg={sessionMsg}
              onClearSessionMsg={() => setSessionMsg(null)}
              onRevokeSession={handleRevokeSession}
              onRevokeOtherSessions={handleRevokeAllSessions}
              onSignOut={logout}
            />

            <DangerZoneSection
              onOpenDeleteModal={() => setShowDeleteModal(true)}
            />

            <DeleteAccountModal
              isOpen={showDeleteModal}
              deleteConfirmation={deleteConfirmation}
              deleteCloudFiles={deleteCloudFiles}
              isDeleting={isDeletingAccount}
              deleteError={deleteError}
              onConfirmationChange={setDeleteConfirmation}
              onDeleteCloudFilesChange={setDeleteCloudFiles}
              onClose={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation("");
                setDeleteError(null);
              }}
              onDelete={handleDeleteAccount}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
