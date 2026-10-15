import { ProviderSummary } from "@/stores/drive.store";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface RevocationWarningBannerProps {
  revokedProviders: ProviderSummary[];
  apiUrl: string;
  providerToSlug: (p: string) => string;
}

export function RevocationWarningBanner({
  revokedProviders,
  apiUrl,
  providerToSlug,
}: RevocationWarningBannerProps) {
  if (revokedProviders.length === 0) return null;

  return (
    <div className="mb-5 p-4 rounded-xl bg-amber-50/95 border border-amber-300 text-amber-900 text-xs shadow-2xs animate-in fade-in">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 shrink-0 mt-0.5">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-amber-950 text-xs sm:text-sm mb-1">
            Action Required: {revokedProviders.length} Cloud Connection
            {revokedProviders.length > 1 ? "s" : ""} Expired or Revoked
          </div>
          <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed mb-2.5">
            {revokedProviders
              .map(
                (rp) =>
                  `${rp.provider.replace("_", " ").toUpperCase()}${
                    rp.accountEmail ? ` (${rp.accountEmail})` : ""
                  }`,
              )
              .join(", ")}{" "}
            authentication tokens have expired or were revoked. You must reconnect using the{" "}
            <strong>same account</strong> so your existing files remain accessible.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {revokedProviders.map((rp) => (
              <a
                key={rp.id}
                href={`${apiUrl}/providers/${providerToSlug(rp.provider)}/reconnect`}
                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reconnect {rp.provider.replace("_", " ")}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
