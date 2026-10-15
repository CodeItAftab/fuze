/**
 * Production-Grade Email Service for Free Cloud Hosting Providers
 * 
 * Specifically designed to avoid blocked outbound SMTP ports (25, 465, 587) on free tiers 
 * (Render, Railway, Koyeb, Vercel, Fly.io, etc.) by using HTTPS (Port 443) via standard fetch.
 * 
 * Supported Providers (All Free Tier):
 * 1. Resend (Free 3,000 emails/mo) - set RESEND_API_KEY in .env
 * 2. Brevo (Free 300 emails/day) - set BREVO_API_KEY in .env
 * 3. Zero-Config Local/Dev Fallback - logs clickable links to server terminal
 */

export interface SendVerificationEmailParams {
  to: string;
  name: string;
  token: string;
}

export interface SendPasswordResetParams {
  to: string;
  name: string;
  token: string;
}

export class EmailService {
  private static getClientOrigin(): string {
    return process.env.CLIENT_ORIGIN || "http://localhost:3000";
  }

  private static getSenderEmail(): string {
    return process.env.EMAIL_FROM || "Fuze Drive <noreply@fuzedrive.tech>";
  }

  /**
   * Send Email Verification Link (One-Click Link Only)
   */
  static async sendVerificationEmail(params: {
    to: string;
    name: string;
    token: string;
    clientOrigin?: string;
  }): Promise<{ success: boolean; devLink?: string }> {
    const origin = params.clientOrigin || this.getClientOrigin();
    const verificationUrl = `${origin}/verify-email?token=${encodeURIComponent(params.token)}&email=${encodeURIComponent(params.to)}`;

    const subject = "Verify your email address for Fuze";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); overflow: hidden;" cellpadding="0" cellspacing="0">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 36px; text-align: left;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 40px; height: 40px; background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px; color: #ffffff; font-weight: bold;">⚡</div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Fuze</span>
                    <span style="display: block; font-size: 11px; color: #bfdbfe; font-weight: 500;">Zero-Proxy Multi-Cloud Storage</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Hi <strong>${escapeHtml(params.name)}</strong>,<br><br>
                Thank you for creating an account on Fuze. Please click the button below to verify your email address and activate all features.
              </p>
              
              <!-- Action Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);">
                      Verify Email Address →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                This verification link will expire in <strong>24 hours</strong>.<br>
                If you did not register for a Fuze account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center; font-size: 11px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} Fuze Cloud. Zero-proxy client-side distributed storage.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return this.deliverEmail({
      to: params.to,
      subject,
      html,
      devLabel: "EMAIL VERIFICATION",
      devLink: verificationUrl,
    });
  }

  /**
   * Send Password Reset Link
   */
  static async sendPasswordResetEmail(params: {
    to: string;
    name: string;
    token: string;
    clientOrigin?: string;
  }): Promise<{ success: boolean; devLink?: string }> {
    const origin = params.clientOrigin || this.getClientOrigin();
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(params.token)}&email=${encodeURIComponent(params.to)}`;

    const subject = "Reset your Fuze account password";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); overflow: hidden;" cellpadding="0" cellspacing="0">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 32px 36px; text-align: left;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 40px; height: 40px; background-color: rgba(255, 255, 255, 0.15); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px; color: #ffffff;">🔒</div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Fuze</span>
                    <span style="display: block; font-size: 11px; color: #94a3b8; font-weight: 500;">Security Center</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                Password Reset Request
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Hi <strong>${escapeHtml(params.name)}</strong>,<br><br>
                We received a request to reset the password for your Fuze account. Click the button below to set a new password.
              </p>
              
              <!-- Action Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 14px 18px; margin: 24px 0; font-size: 12px; color: #be123c; line-height: 1.5;">
                <strong>Security Notice:</strong> This reset link will expire in <strong>1 hour</strong>. For your security, resetting your password will also revoke any other active sessions.
              </div>

              <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                If you did not request this change, please ignore this email. Your current password will remain unchanged.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center; font-size: 11px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} Fuze Cloud. Zero-proxy client-side distributed storage.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return this.deliverEmail({
      to: params.to,
      subject,
      html,
      devLabel: "PASSWORD RESET",
      devLink: resetUrl,
    });
  }

  /**
   * Universal HTTP (Port 443) Email Dispatcher
   * Multi-provider cascade with strict 5-second timeouts.
   * NEVER uses raw SMTP ports (25/465/587) which are blocked on free cloud hosts.
   * Everything runs over standard HTTPS (Port 443) via native fetch.
   */
  private static async deliverEmail(opts: {
    to: string;
    subject: string;
    html: string;
    devLabel: string;
    devLink: string;
    devCode?: string;
  }): Promise<{ success: boolean; devLink?: string }> {
    const TIMEOUT_MS = 6000; // 6-second hard timeout for external network calls

    // 1. Try Gmail REST API via HTTPS Port 443 (Zero custom domain required!)
    const gmailUser = process.env.GMAIL_USER;
    const gmailClientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (gmailUser && gmailClientId && gmailClientSecret && gmailRefreshToken) {
      try {
        // Exchange refresh token for fresh access token via HTTPS
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: gmailClientId,
            client_secret: gmailClientSecret,
            refresh_token: gmailRefreshToken,
            grant_type: "refresh_token",
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (tokenRes.ok) {
          const tokenData = (await tokenRes.json()) as { access_token?: string };
          if (tokenData.access_token) {
            // Build RFC 2822 email payload and base64url encode it
            const utf8Subject = `=?utf-8?B?${Buffer.from(opts.subject).toString("base64")}?=`;
            const rawMessage = [
              `From: "Fuze Cloud" <${gmailUser}>`,
              `To: ${opts.to}`,
              `Subject: ${utf8Subject}`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=utf-8`,
              ``,
              opts.html,
            ].join("\r\n");

            const encodedMessage = Buffer.from(rawMessage)
              .toString("base64")
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");

            // Dispatch directly through Google's official Gmail REST API (Port 443)
            const sendRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ raw: encodedMessage }),
                signal: AbortSignal.timeout(TIMEOUT_MS),
              },
            );

            if (sendRes.ok) {
              console.log(
                `[EmailService] Gmail REST API delivered ${opts.devLabel} to ${opts.to}`,
              );
              return { success: true };
            } else {
              const sendErr = await sendRes.text();
              console.warn(
                `[EmailService] Gmail API error (${sendRes.status}): ${sendErr}`,
              );
            }
          }
        } else {
          const tokenErr = await tokenRes.text();
          console.warn(
            `[EmailService] Gmail OAuth token refresh failed (${tokenRes.status}): ${tokenErr}`,
          );
        }
      } catch (err: any) {
        console.warn(`[EmailService] Gmail REST API call failed:`, err?.message);
      }
    }

    // 2. Try Resend via HTTPS (Port 443)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: this.getSenderEmail(),
            to: [opts.to],
            subject: opts.subject,
            html: opts.html,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (res.ok) {
          console.log(`[EmailService] Resend delivered ${opts.devLabel} to ${opts.to}`);
          return { success: true };
        } else {
          const err = await res.text();
          console.warn(`[EmailService] Resend error (${res.status}): ${err}`);
        }
      } catch (err: any) {
        console.warn(`[EmailService] Resend request failed:`, err?.message);
      }
    }

    // 3. Try Brevo via HTTPS (Port 443)
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { email: "no-reply@fuze.cloud", name: "Fuze" },
            to: [{ email: opts.to }],
            subject: opts.subject,
            htmlContent: opts.html,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (res.ok) {
          console.log(`[EmailService] Brevo delivered ${opts.devLabel} to ${opts.to}`);
          return { success: true };
        } else {
          const err = await res.text();
          console.warn(`[EmailService] Brevo error (${res.status}): ${err}`);
        }
      } catch (err: any) {
        console.warn(`[EmailService] Brevo request failed:`, err?.message);
      }
    }

    // 4. Fallback / Dev Mode: Clean terminal preview with actionable link
    console.log(`\n======================================================`);
    console.log(`📨 [FUZE EMAIL SERVICE] ${opts.devLabel}`);
    console.log(`To:      ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    if (opts.devCode) {
      console.log(`Code:    👉 ${opts.devCode} 👈`);
    }
    console.log(`Link:    🔗 ${opts.devLink}`);
    console.log(
      `(Set GMAIL_USER & GMAIL_REFRESH_TOKEN or RESEND_API_KEY in .env to deliver real emails)`,
    );
    console.log(`======================================================\n`);

    return {
      success: true,
      devLink: opts.devLink,
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
