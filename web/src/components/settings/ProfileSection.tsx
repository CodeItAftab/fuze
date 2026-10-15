import { useState } from "react";
import { User, Check, Loader2, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  name: string;
  email: string;
  emailVerified?: boolean;
}

interface ProfileSectionProps {
  user: UserProfile | null;
  onUpdateProfile: (name: string) => Promise<{ success: boolean; error?: string }>;
  onResendVerification: () => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function ProfileSection({
  user,
  onUpdateProfile,
  onResendVerification,
}: ProfileSectionProps) {
  const [name, setName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Name cannot be empty." });
      return;
    }
    setIsUpdating(true);
    const res = await onUpdateProfile(name.trim());
    setIsUpdating(false);
    if (res.success) {
      setProfileMsg({ type: "success", text: "Name updated successfully." });
      setTimeout(() => setProfileMsg(null), 3000);
    } else {
      setProfileMsg({ type: "error", text: res.error || "Failed to update profile" });
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMsg(null);
    const res = await onResendVerification();
    setIsResending(false);
    if (res.success) {
      setResendMsg(res.message || "Verification email sent! Check your inbox.");
      setTimeout(() => setResendMsg(null), 4000);
    } else {
      setResendMsg(res.error || "Failed to send verification email.");
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <User className="h-4 w-4 text-slate-700" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Personal Information
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 mb-4">
        Manage your display name and email address
      </p>

      {/* Email Verification Status Card */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          user?.emailVerified
            ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-900"
            : "bg-amber-50/70 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {user?.emailVerified ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <Mail className="h-4 w-4 text-amber-600 shrink-0" />
          )}
          <div>
            <div className="text-xs font-semibold flex items-center gap-1.5">
              <span>{user?.email}</span>
              {user?.emailVerified ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {user?.emailVerified
                ? "Your email address is verified and active."
                : "Verify your email to ensure uninterrupted account access."}
            </p>
          </div>
        </div>

        {!user?.emailVerified && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/verify-email?email=${encodeURIComponent(user?.email || "")}`}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1"
            >
              <span>Enter Code</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              disabled={isResending}
              onClick={handleResend}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition cursor-pointer"
            >
              {isResending ? "Sending..." : "Resend"}
            </button>
          </div>
        )}
      </div>

      {resendMsg && (
        <div className="mt-3 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs">
          {resendMsg}
        </div>
      )}

      {/* Edit Name Form */}
      <form onSubmit={handleSubmit} className="pt-4 space-y-4">
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
            disabled={isUpdating}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : profileMsg?.type === "success" ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : null}
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </section>
  );
}
