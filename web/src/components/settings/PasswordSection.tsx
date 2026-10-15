import { useState } from "react";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

interface PasswordSectionProps {
  onChangePassword: (
    currentPw: string,
    newPw: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function PasswordSection({ onChangePassword }: PasswordSectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsChanging(true);
    const res = await onChangePassword(currentPassword, newPassword);
    setIsChanging(false);

    if (res.success) {
      setPasswordMsg({
        type: "success",
        text: "Password updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(null), 3000);
    } else {
      setPasswordMsg({
        type: "error",
        text: res.error || "Failed to change password",
      });
    }
  };

  return (
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

      <form onSubmit={handleSubmit} className="space-y-3.5">
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
            disabled={isChanging}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isChanging && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Update Password</span>
          </button>
        </div>
      </form>
    </section>
  );
}
