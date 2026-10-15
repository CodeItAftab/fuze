import dns from "node:dns/promises";

// Curated blocklist of well-known disposable, temporary, and burner email domains
const DISPOSABLE_DOMAINS = new Set<string>([
  // Mailinator & aliases
  "mailinator.com",
  "mailin8r.com",
  "mailinator2.com",
  "suremail.info",
  "spamherelots.com",
  "binkmail.com",
  "safetymail.info",

  // Guerrilla Mail & aliases
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.biz",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "pokemail.net",
  "spam4.me",

  // 10 Minute Mail & aliases
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "10minemail.com",
  "minuteinbox.com",
  "20minutemail.it",

  // TempMail & variants
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempail.com",
  "dispostable.com",
  "throwawaymail.com",
  "throwaway.email",
  "trashmail.com",
  "trashmail.net",
  "trashmail.me",
  "trash-mail.com",

  // YOPmail & aliases
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",
  "nomail.xl.cx",
  "mega.zik.dj",
  "speed.1s.fr",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",

  // Other major disposable services
  "getairmail.com",
  "mohmal.com",
  "emailondeck.com",
  "crazymailing.com",
  "generator.email",
  "dropmail.me",
  "fakeinbox.com",
  "burnermail.io",
  "nada.ltd",
  "getnada.com",
  "inboxkitten.com",
  "mytemp.email",
  "tempinbox.com",
  "harakirimail.com",
  "maildrop.cc",
  "mailcatch.com",
  "fakemailgenerator.com",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "einrot.com",
  "meltmail.com",
  "disposablemail.com",
  "chacuo.net",
  "0815.ru",
  "bccto.me",
  "mytemp.email",
]);

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
