import { Laptop, Smartphone, Globe, Lock, LogOut, Trash2, Loader2 } from "lucide-react";

export interface SessionItem {
  id: string;
  device: string;
  userAgent?: string;
  createdAt: string;
  isCurrent: boolean;
}

interface SessionsSectionProps {
  sessions: SessionItem[];
  isLoading: boolean;
  revokingSessionId: string | null;
  isRevokingAll: boolean;
  sessionMsg: { type: "success" | "error"; text: string } | null;
  onClearSessionMsg: () => void;
  onRevokeSession: (id: string) => void;
  onRevokeOtherSessions: () => void;
  onSignOut: () => void;
}

export function SessionsSection({
  sessions,
  isLoading,
  revokingSessionId,
  isRevokingAll,
  sessionMsg,
  onClearSessionMsg,
  onRevokeSession,
  onRevokeOtherSessions,
  onSignOut,
}: SessionsSectionProps) {
  const getDeviceIcon = (deviceStr: string, ua?: string) => {
    const raw = `${deviceStr} ${ua || ""}`.toLowerCase();
    if (raw.includes("mobile") || raw.includes("iphone") || raw.includes("android")) {
      return <Smartphone className="h-4 w-4 text-slate-500" />;
    }
    if (raw.includes("windows") || raw.includes("mac") || raw.includes("linux")) {
      return <Laptop className="h-4 w-4 text-slate-500" />;
    }
    return <Globe className="h-4 w-4 text-slate-500" />;
  };

  const formatSessionDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Active Sessions & Devices
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Devices and browsers currently authenticated to your Fuze Drive account
          </p>
        </div>

        {sessions.some((s) => !s.isCurrent) && (
          <button
            type="button"
            onClick={onRevokeOtherSessions}
            disabled={isRevokingAll}
            className="self-start sm:self-auto px-3 py-1.5 border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            {isRevokingAll ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            ) : (
              <Lock className="h-3 w-3 text-slate-400" />
            )}
            <span>Revoke Other Sessions</span>
          </button>
        )}
      </div>

      {sessionMsg && (
        <div
          className={`mb-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
            sessionMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{sessionMsg.text}</span>
          <button
            onClick={onClearSessionMsg}
            className="text-xs font-bold px-1 hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-xs">Loading active sessions...</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                s.isCurrent
                  ? "border-blue-200/80 bg-blue-50/20"
                  : "border-slate-200/80 bg-white hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0 mt-0.5 sm:mt-0">
                  {getDeviceIcon(s.device, s.userAgent)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {s.device}
                    </span>
                    {s.isCurrent && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Now (This Device)</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {s.isCurrent
                      ? `Session started ${formatSessionDate(s.createdAt)}`
                      : `Logged in ${formatSessionDate(s.createdAt)}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {s.isCurrent ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <LogOut className="h-3 w-3 text-slate-500" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRevokeSession(s.id)}
                    disabled={revokingSessionId === s.id}
                    className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200/70 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    {revokingSessionId === s.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <p className="text-xs text-slate-400 py-3 text-center">
              No active sessions recorded.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
