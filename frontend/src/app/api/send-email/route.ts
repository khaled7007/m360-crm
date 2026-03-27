import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.EMAIL_FROM || "notifications@m360.sa";
const FROM_NAME      = process.env.EMAIL_FROM_NAME || "ذرى — نظام إدارة التمويل";

interface Recipient { name: string; email: string }
interface EmailPayload { recipients: Recipient[]; subject: string; body: string }

function buildHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d3635 0%,#315453 100%);padding:28px 36px;text-align:center;">
            <p style="margin:0;font-size:26px;font-weight:900;color:#F4C57A;letter-spacing:2px;">ذرى</p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,.7);">للتمويل الجماعي بالدين</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:#1d3635;">${subject}</h2>
            <p style="margin:0;font-size:15px;line-height:1.8;color:#444;">${body}</p>
            <div style="margin:24px 0;height:1px;background:#eee;"></div>
            <p style="margin:0;font-size:12px;color:#999;">هذا إشعار تلقائي من نظام M360 CRM. يُرجى عدم الرد على هذا البريد.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#1d3635;padding:16px 36px;text-align:center;">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,.5);">© ${new Date().getFullYear()} ذرى — جميع الحقوق محفوظة</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, body } = await req.json() as EmailPayload;

    if (!RESEND_API_KEY) {
      // No API key — log and return success so the main flow isn't blocked
      console.log("[EMAIL SKIPPED — no RESEND_API_KEY]", { subject, recipients: recipients.map(r => r.email) });
      return NextResponse.json({ ok: true, mode: "logged" });
    }

    // Send via Resend
    const results = await Promise.allSettled(
      recipients.map((r) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from:    `${FROM_NAME} <${FROM_EMAIL}>`,
            to:      [r.email],
            subject,
            html:    buildHtml(subject, body),
          }),
        }).then((res) => res.json())
      )
    );

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[send-email] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
