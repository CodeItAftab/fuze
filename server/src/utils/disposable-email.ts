import dns from "node:dns/promises";
import bundledDisposableDomains from "./disposable-domains.json";

// Comprehensive in-memory blocklist of 97,000+ disposable domains (O(1) lookup time)
const DISPOSABLE_DOMAINS = new Set<string>(bundledDisposableDomains);

// Periodically refresh list from upstream community blocklists non-blockingly
async function refreshBlocklist(): Promise<void> {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf",
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return;
    const text = await res.text();
    const domains = text.split("\n").map((d) => d.trim().toLowerCase()).filter(Boolean);
    for (const d of domains) {
      DISPOSABLE_DOMAINS.add(d);
    }
  } catch {
    // Non-fatal; fallback to bundled blocklist
  }
}

// Background initial refresh after 15s, then every 24 hours
setTimeout(() => {
  refreshBlocklist().catch(() => {});
  setInterval(() => {
    refreshBlocklist().catch(() => {});
  }, 24 * 60 * 60 * 1000).unref();
}, 15000).unref();

// Trusted major providers that bypass DNS checks for maximum speed
const TRUSTED_DOMAINS = new Set<string>([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "aol.com",
  "gmx.com",
  "mail.com",
  "fastmail.com",
  "tutanota.com",
  "tuta.com",
]);

/**
 * Validates whether an email address is from a genuine, legitimate provider
 * and not a disposable, temporary, or non-existent domain.
 */
export async function validateLegitimateEmail(
  email: string,
): Promise<{ isValid: boolean; reason?: string }> {
  const parts = email.split("@");
  if (parts.length !== 2) {
    return { isValid: false, reason: "Invalid email format." };
  }

  const domain = parts[1].toLowerCase().trim();

  // 1. Instant check for trusted major providers (0ms latency)
  if (TRUSTED_DOMAINS.has(domain)) {
    return { isValid: true };
  }

  // 2. Check explicit disposable blocklist
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      reason:
        "Disposable and temporary email addresses are not permitted. Please use a valid personal or business email address.",
    };
  }

  // 3. Heuristic pattern checks (e.g. temp*, trash*, fake*, burner*)
  const root = domain.split(".")[0];
  if (
    root.startsWith("temp-") ||
    root.startsWith("temp_") ||
    root.startsWith("dispos") ||
    root.startsWith("throwaway") ||
    root.startsWith("burner") ||
    root.startsWith("fake") ||
    root.startsWith("10min") ||
    root.endsWith("mailinator")
  ) {
    return {
      isValid: false,
      reason:
        "Temporary and burner email addresses are not allowed. Please use your genuine email address.",
    };
  }

  // 4. DNS MX Record Verification (Fast timeout: 2000ms)
  // Ensures the domain actually exists and has an active mail server configured
  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), 2000),
      ),
    ]);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        isValid: false,
        reason:
          "The email domain does not have valid mail exchange (MX) records. Please provide a working email address.",
      };
    }

    // 5. MX Exchange Host Verification:
    // Catches brand-new, unlisted temporary domains whose mail servers still route
    // back to known disposable mail infrastructure (e.g. mail.temp-mail.org, mx.mailinator.com)
    for (const record of mxRecords) {
      const exchange = (record.exchange || "").toLowerCase().trim();
      const parts = exchange.split(".");
      const exchangeDomain = parts.slice(-2).join(".");
      if (
        DISPOSABLE_DOMAINS.has(exchange) ||
        DISPOSABLE_DOMAINS.has(exchangeDomain) ||
        exchange.includes("mailinator") ||
        exchange.includes("guerrillamail") ||
        exchange.includes("temp-mail") ||
        exchange.includes("10minutemail") ||
        exchange.includes("yopmail")
      ) {
        return {
          isValid: false,
          reason:
            "Disposable and temporary email addresses are not permitted. Please use a valid personal or business email address.",
        };
      }
    }
  } catch (err: any) {
    // If domain lookup explicitly returned ENOTFOUND or ENODATA, it cannot receive emails
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      return {
        isValid: false,
        reason:
          "The email domain does not appear to exist or cannot receive mail. Please double-check your email address.",
      };
    }
    // On network/timeout error, allow graceful fallback so legit business domains aren't blocked
  }

  return { isValid: true };
}
