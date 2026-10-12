"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { Cloud, Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState(emailParam);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Auto-verify as soon as the user clicks the link in their email
  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  const handleVerify = async (verificationToken: string) => {
    setIsLoading(true);
    setError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${apiUrl}/auth/verify-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Email verification failed");
      }

      setIsSuccess(true);
      if (data.user) {
        setAuth(data.user);
      }
      setTimeout(() => {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification link is invalid or has expired. Please request a new one.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Please enter your email to resend verification link");
      return;
    }

    setIsResending(true);
    setResendStatus(null);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend email");
      }

      setResendStatus(
        data.message || "A verification link has been sent to your email inbox!",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center justify-center mb-5 group transition-transform hover:scale-105">
          <FuzeLogo variant="full" height={30} />
        </Link>
        <h2 className="text-xl font-bold text-slate-800">
          Email Verification
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Confirm your email to secure and activate your personal cloud storage.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-2xl">
          {isLoading ? (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-800">
                Verifying your email token...
              </p>
              <p className="text-[11px] text-slate-500">
                Please wait a moment while we validate your credentials.
              </p>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-3">
              <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Email Verified Successfully!
              </h3>
              <p className="text-xs text-slate-600 mb-6">
                Your account is confirmed and fully verified. Redirecting you to your dashboard...
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resendStatus && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              {!token ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Please click the verification link sent to your email inbox. If you need a new link, enter your email below to resend it.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-70 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isResending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Resend Verification Link</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-600">
                    If verification didn't complete automatically, click below to retry.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleVerify(token)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                  >
                    Retry Verification
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
                <Link
                  href="/dashboard"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 transition"
                >
                  Return to Dashboard
                </Link>
                <Link
                  href="/login"
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  Sign in with another account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
