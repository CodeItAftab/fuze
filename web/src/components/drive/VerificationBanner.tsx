"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

export function VerificationBanner() {
  const { user, checkSession } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If user is not loaded or already verified, do not render the banner
  if (!user || user.emailVerified === true) {
    return null;
  }

  const handleSendVerification = async () => {
    if (!user.email) return;
    setIsSending(true);
    setToastMessage(null);
    setErrorMessage(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification email");
      }

      setToastMessage(
        data.message || "Verification link sent! Please check your inbox.",
      );
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);

      void checkSession();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error sending email. Please try again.",
      );
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Sleek Bottom-Right Toast (Non-overlapping with top banners or navigation) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-sm">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-slate-100">Verification Link Sent</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{toastMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-rose-500/40 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-sm">
          <div className="h-7 w-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-slate-100">Notice</div>
            <div className="text-[11px] text-rose-300 mt-0.5">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Modern, Clean SaaS Verification Banner (Linear/Stripe Style) */}
      <div className="w-full bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 sm:px-6 shrink-0 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <div className="text-xs text-slate-300 truncate">
              <span className="font-semibold text-white mr-1.5">
                Verify your email address
              </span>
              <span className="text-slate-400 hidden md:inline">
                — We sent a link to <strong className="text-slate-200 font-medium">{user.email}</strong>. Please confirm your email to connect cloud providers and enable uploads.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSendVerification}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending link...</span>
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  <span>Resend link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
