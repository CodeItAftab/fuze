import { Lock, Loader2, ArrowRight } from "lucide-react";

interface SharePasswordPromptProps {
  passwordInput: string;
  isVerifying: boolean;
  passwordError: string | null;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SharePasswordPrompt({
  passwordInput,
  isVerifying,
  passwordError,
  onPasswordChange,
  onSubmit,
}: SharePasswordPromptProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Password Protected File
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            This shared file requires an authorized access password to view or download.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <input
              type="password"
              required
              autoFocus
              value={passwordInput}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter file password"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition text-center"
            />
            {passwordError && (
              <p className="text-xs text-rose-600 mt-2 font-medium">
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || !passwordInput.trim()}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            {isVerifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Access Shared File</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
