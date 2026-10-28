"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AvailableCloud } from "./AvailableCloudCard";
import { ProviderIcon, parseProvider } from "@/components/drive/ProviderBadge";
import {
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

interface ConnectCredentialsModalProps {
  cloud: AvailableCloud | null;
  apiUrl: string;
  onClose: () => void;
  onSuccess: (providerName: string) => void;
}

export function ConnectCredentialsModal({
  cloud,
  apiUrl,
  onClose,
  onSuccess,
}: ConnectCredentialsModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cloud) return null;

  const parsed = parseProvider(cloud.name);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/providers/connect-credentials`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: cloud.id,
          credentials: formData,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to connect ${cloud.name}`);
      }

      onSuccess(cloud.name);
      onClose();
    } catch (err: any) {
      setError(err.message || "Connection failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const defaultFields: Record<
    string,
    Array<{
      name: string;
      label: string;
      placeholder: string;
      type?: string;
      defaultValue?: string;
      helpText?: string;
    }>
  > = {
    koofr: [
      {
        name: "user",
        label: "Koofr Account Email",
        placeholder: "you@email.com",
        type: "email",
        helpText: "Your registered Koofr account email address",
      },
      {
        name: "pass",
        label: "Generated App Password",
        placeholder: "e.g. koofr-app-password-xxxx",
        type: "password",
        helpText:
          "Generate this in Koofr Preferences -> Password -> App Passwords. Do NOT use your main account password.",
      },
    ],
    mega: [
      {
        name: "email",
        label: "MEGA Account Email",
        placeholder: "you@email.com",
        type: "email",
        helpText: "Your free 20 GB MEGA account email address",
      },
      {
        name: "password",
        label: "MEGA Password",
        placeholder: "••••••••",
        type: "password",
        helpText: "Encrypted at rest with AES-256-GCM. Never stored in plain text.",
      },
    ],
    infinicloud: [
      {
        name: "url",
        label: "InfiniCLOUD WebDAV URL",
        placeholder: "https://[your-account-id].teracloud.jp/dav",
        defaultValue: "https://teracloud.jp/dav",
        helpText: "Found in your InfiniCLOUD Account -> 'External Apps Connection'",
      },
      {
        name: "user",
        label: "User / Account ID",
        placeholder: "e.g. user12345",
        helpText: "Your InfiniCLOUD User ID",
      },
      {
        name: "pass",
        label: "Connection App Password",
        placeholder: "••••••••",
        type: "password",
        helpText: "Generated in InfiniCLOUD Account Settings -> 'Connection Password'",
      },
    ],
  };

  const fields = cloud.credentialFields || defaultFields[cloud.id] || [
    { name: "user", label: "Username / Email", placeholder: "you@email.com" },
    { name: "pass", label: "Password / Key", placeholder: "••••••••", type: "password" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200/90 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
            <ProviderIcon type={parsed.type} className="h-6 w-6 object-contain" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Connect {cloud.name}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {cloud.freeTier}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              100% free consumer storage integration
            </p>
          </div>
        </div>

        {/* Dedicated Guidance for Koofr App Password */}
        {cloud.id === "koofr" && (
          <div className="mb-4 p-3.5 rounded-xl bg-teal-50/80 border border-teal-200/90 text-teal-950 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-teal-900">
              <KeyRound className="h-4 w-4 text-teal-600 shrink-0" />
              <span>How to generate a Koofr App Password</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-teal-800 text-[11px] leading-relaxed">
              <li>Open your free 10 GB Koofr account in your browser.</li>
              <li>Go to <strong>Settings</strong> &rarr; <strong>Preferences</strong> &rarr; <strong>Password</strong>.</li>
              <li>Under <strong>App Passwords</strong>, name it <em>&quot;Fuze Drive&quot;</em> and click <strong>Generate</strong>.</li>
              <li>Paste your Koofr email and that generated password below.</li>
            </ol>
            <div className="flex items-center justify-between pt-1 border-t border-teal-200/60">
              <a
                href="https://app.koofr.net/app/admin/preferences/password"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 hover:underline"
              >
                <span>Open Koofr Password Settings</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <Link
                href="/guides/connect-cloud-providers#koofr"
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
              >
                <HelpCircle className="h-3 w-3" />
                <span>Full Guide</span>
              </Link>
            </div>
          </div>
        )}

        {/* Dedicated Guidance for MEGA */}
        {cloud.id === "mega" && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50/80 border border-rose-200/90 text-rose-950 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-rose-900">
              <ShieldCheck className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Free 20 GB MEGA Account</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              Enter your MEGA login credentials. Your password is encrypted with <strong>AES-256-GCM</strong> before database storage and only used to authenticate your session.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-rose-200/60">
              <a
                href="https://mega.io/register"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:underline"
              >
                <span>Need an account? Register free (20 GB)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <Link
                href="/guides/connect-cloud-providers#mega"
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
              >
                <HelpCircle className="h-3 w-3" />
                <span>Guide</span>
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                {field.label}
              </label>
              <input
                type={field.type || "text"}
                placeholder={field.placeholder}
                required
                value={formData[field.name] ?? field.defaultValue ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
              />
              {field.helpText && (
                <p className="text-[10px] text-slate-400">{field.helpText}</p>
              )}
            </div>
          ))}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Connect {cloud.name}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
