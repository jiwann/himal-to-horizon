import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Use a custom verified sender once himaltohorizon.com is verified in Resend.
// Until then, Resend's default onboarding address works for any API key with no domain setup required.
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Himal to Horizon <onboarding@resend.dev>";

export interface AlertEmailData {
  toEmail: string;
  toName: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  baselinePrice: number;
  newPrice: number;
  savings: number;
  savingsPercent: number;
  currency: string;
  language?: string;
}

const BRAND_ACCENT = "#F7B088";
const BRAND_BG = "#060D17";
const BRAND_TEXT = "#E8DDD0";

function emailWrapper(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Himal to Horizon</title></head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:sans-serif;color:${BRAND_TEXT};">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-family:serif;font-size:22px;color:${BRAND_ACCENT};font-weight:700;">Himal to Horizon</span>
    </div>
    ${body}
    <div style="text-align:center;margin-top:28px;font-size:12px;color:#4B5563;">
      © Himal to Horizon · <a href="https://himaltohorizon.com" style="color:${BRAND_ACCENT};text-decoration:none;">himaltohorizon.com</a>
    </div>
  </div>
</body>
</html>`.trim();
}

export async function sendVerificationEmail(toEmail: string, toName: string | null, token: string): Promise<boolean> {
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://himaltohorizon.com"
    : `http://localhost:${process.env.PORT || 5000}`;
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const displayName = toName || toEmail;

  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — skipping verification email to", toEmail);
    console.log("[email] Verify URL (dev):", verifyUrl);
    return false;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmail,
      subject: "Verify your email — Himal to Horizon",
      html: emailWrapper(`
    <div style="background:rgba(247,176,136,0.06);border:1px solid rgba(247,176,136,0.2);border-radius:16px;padding:28px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_ACCENT};margin-bottom:16px;">Email Verification</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:12px;">Welcome, ${displayName}!</div>
      <p style="font-size:14px;color:#9CA3AF;margin-bottom:24px;line-height:1.6;">
        You're almost there. Click the button below to verify your email address and activate your Himal to Horizon account.
      </p>
      <div style="text-align:center;margin-bottom:20px;">
        <a href="${verifyUrl}"
           style="display:inline-block;background:${BRAND_ACCENT};color:${BRAND_BG};padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:15px;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size:12px;color:#6B7280;text-align:center;">
        This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
      </p>
    </div>`),
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send verification email:", err);
    return false;
  }
}

export async function sendPriceAlertEmail(data: AlertEmailData): Promise<boolean> {
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — skipping email to", data.toEmail);
    console.log("[email] Alert:", JSON.stringify(data, null, 2));
    return false;
  }

  const currencySymbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", AUD: "A$", INR: "₹", BRL: "R$"
  };
  const sym = currencySymbols[data.currency] ?? data.currency + " ";
  const fmt = (n: number) => `${sym}${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.toEmail,
      subject: `Price Drop Alert: ${data.origin} → ${data.destination} now ${fmt(data.newPrice)}`,
      html: emailWrapper(`
    <div style="background:rgba(247,176,136,0.06);border:1px solid rgba(247,176,136,0.2);border-radius:16px;padding:28px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_ACCENT};margin-bottom:16px;">Price Drop Detected</div>
      <div style="font-size:28px;font-weight:700;margin-bottom:4px;">${data.origin} → ${data.destination}</div>
      <div style="font-size:14px;color:#9CA3AF;margin-bottom:24px;">${data.departureDate}${data.returnDate ? " → " + data.returnDate : ""}</div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-size:16px;text-decoration:line-through;color:#6B7280;">${fmt(data.baselinePrice)}</span>
        <span style="font-size:32px;font-weight:800;color:#34D399;">${fmt(data.newPrice)}</span>
        <span style="background:#059669;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;">−${data.savingsPercent.toFixed(0)}%</span>
      </div>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);font-size:13px;color:#9CA3AF;">
        You're saving <strong style="color:${BRAND_ACCENT};">${fmt(data.savings)}</strong> compared to when you set this alert.
      </div>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <a href="https://himaltohorizon.com/results?origin=${data.origin}&destination=${data.destination}&departureDate=${data.departureDate}${data.returnDate ? "&returnDate=" + data.returnDate : ""}"
         style="display:inline-block;background:${BRAND_ACCENT};color:${BRAND_BG};padding:14px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:15px;">
        Book This Flight
      </a>
    </div>`),
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send alert:", err);
    return false;
  }
}
