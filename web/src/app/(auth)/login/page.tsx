"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { Cloud, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const modeParam = searchParams.get("mode") || searchParams.get("tab");
  const isRevoked = searchParams.get("revoked") === "true";

  const { setAuth } = useAuthStore();

  const [isRegister, setIsRegister] = useState(modeParam === "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setResendStatus(null);
    setIsLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const endpoint = isRegister ? `${apiUrl}/auth/register` : `${apiUrl}/auth/login`;
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.unverified) {
          setUnverifiedEmail(data.email || email);
        }
        throw new Error(data.error || "Authentication failed");
      }

      if (isRegister && data.unverified) {
        setIsRegisteredSuccess(true);
        setUnverifiedEmail(data.email || email);
        return;
      }

      setAuth(data.user);
      const destination =
        redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
          ? redirectParam
          : "/dashboard";

      // Full page navigation bypasses App Router client cache and ensures session cookies reach middleware
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = destination;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email;
    if (!targetEmail) return;

    setIsResending(true);
    setResendStatus(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend");
      }
      setResendStatus("Verification email sent! Check your inbox.");
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
          {isRegisteredSuccess
            ? "Verify your email"
            : isRegister
            ? "Create your free account"
            : "Welcome back to your unified cloud"}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Zero-proxy personal cloud storage aggregator
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-2xl">
          {isRegisteredSuccess ? (
            <div className="text-center py-2 space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Check your inbox</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We've sent a verification link to{" "}
                  <strong className="text-slate-900 font-semibold">{unverifiedEmail}</strong>.
                  Please open the email and click the link to confirm your account.
                </p>
              </div>

              {resendStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                  {resendStatus}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-70 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Resend Verification Email</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisteredSuccess(false);
                    setIsRegister(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                    setUnverifiedEmail(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition ${
                    !isRegister
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                    setUnverifiedEmail(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition ${
                    isRegister
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Register
                </button>
              </div>

              {isRevoked && !unverifiedEmail && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-amber-900">
                      Session Terminated
                    </span>
                    <span className="text-[11px] text-amber-700 leading-relaxed block mt-0.5">
                      Your session was revoked from another device or expired. Please sign in again.
                    </span>
                  </div>
                </div>
              )}

              {unverifiedEmail && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                    <Mail className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Email verification required</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Please verify your email to access your account.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <Link
                      href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                      className="font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Enter Code</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="font-semibold text-amber-800 hover:underline disabled:opacity-50"
                    >
                      {isResending ? "Resending..." : "Resend Link"}
                    </button>
                  </div>
                  {resendStatus && (
                    <div className="text-[11px] text-emerald-700 font-medium pt-1">
                      {resendStatus}
                    </div>
                  )}
                </div>
              )}

              {error && !unverifiedEmail && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email address
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

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    {!isRegister && (
                      <Link
                        href="/forgot-password"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-70 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isRegister ? "Create Free Account" : "Sign In to Fuze"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Encrypted sessions with direct zero-proxy streaming</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
