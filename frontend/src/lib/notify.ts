/**
 * Notification helpers — create in-platform notifications + trigger email
 */

const API = "/api/v1";

export interface NotifyPayload {
  userIds: string[];
  title: string;
  body: string;
  type: string;
  entityType: string;
  entityId: string;
}

/** Create in-platform notifications for a list of user IDs */
export async function createNotifications(token: string, payload: NotifyPayload) {
  await Promise.allSettled(
    payload.userIds.map((userId) =>
      fetch(`${API}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id:     userId,
          title:       payload.title,
          body:        payload.body,
          type:        payload.type,
          entity_type: payload.entityType,
          entity_id:   payload.entityId,
          is_read:     false,
        }),
      })
    )
  );
}

/** Send email notifications via /api/send-email */
export async function sendEmailNotifications(payload: {
  recipients: { name: string; email: string }[];
  subject: string;
  body: string;
}) {
  await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null); // fire-and-forget — don't fail the main action
}

// ── Notification event helpers ─────────────────────────────────────

/** Sent to credit assessment → notify manager + credit analyst */
export async function notifySentToCredit(
  token: string,
  appRef: string,
  orgName: string
) {
  const title = "طلب جديد للتقييم الائتماني";
  const body  = `تم إرسال الطلب ${appRef} — ${orgName} للتقييم الائتماني`;

  await createNotifications(token, {
    userIds:    ["u-002", "u-004"], // manager + credit_analyst
    title, body,
    type:       "credit_assessment_assigned",
    entityType: "application",
    entityId:   appRef,
  });

  await sendEmailNotifications({
    recipients: [
      { name: "سارة محمد",    email: "sarah@m360.sa" },
      { name: "نورة الزهراني", email: "nora@m360.sa"  },
    ],
    subject: title,
    body,
  });
}

/** Application status changed → notify relevant users */
export async function notifyStatusChange(
  token: string,
  appRef: string,
  orgName: string,
  newStatus: string
) {
  const STATUS_NOTIF: Record<string, { title: string; userIds: string[]; emails: { name: string; email: string }[] }> = {
    submitted: {
      title:   "طلب جديد بانتظار المراجعة",
      userIds: ["u-001", "u-002"],
      emails:  [{ name: "المدير", email: "admin@m360.sa" }, { name: "سارة محمد", email: "sarah@m360.sa" }],
    },
    pre_approved: {
      title:   "طلب حصل على الموافقة المبدئية",
      userIds: ["u-003"],
      emails:  [{ name: "أحمد العتيبي", email: "ahmed@m360.sa" }],
    },
    credit_assessment: {
      title:   "طلب جديد للتقييم الائتماني",
      userIds: ["u-002", "u-004"],
      emails:  [{ name: "سارة محمد", email: "sarah@m360.sa" }, { name: "نورة الزهراني", email: "nora@m360.sa" }],
    },
    committee_review: {
      title:   "طلب أُحيل للجنة",
      userIds: ["u-001", "u-002"],
      emails:  [{ name: "المدير", email: "admin@m360.sa" }, { name: "سارة محمد", email: "sarah@m360.sa" }],
    },
    approved: {
      title:   "تمت الموافقة على الطلب",
      userIds: ["u-001", "u-003"],
      emails:  [{ name: "المدير", email: "admin@m360.sa" }, { name: "أحمد العتيبي", email: "ahmed@m360.sa" }],
    },
    rejected: {
      title:   "تم رفض الطلب",
      userIds: ["u-001", "u-003"],
      emails:  [{ name: "المدير", email: "admin@m360.sa" }, { name: "أحمد العتيبي", email: "ahmed@m360.sa" }],
    },
    disbursed: {
      title:   "تم صرف التمويل",
      userIds: ["u-001", "u-002"],
      emails:  [{ name: "المدير", email: "admin@m360.sa" }, { name: "سارة محمد", email: "sarah@m360.sa" }],
    },
  };

  const cfg = STATUS_NOTIF[newStatus];
  if (!cfg) return;

  const body = `${cfg.title}: الطلب ${appRef} — ${orgName}`;

  await createNotifications(token, {
    userIds: cfg.userIds, title: cfg.title, body,
    type: `status_${newStatus}`, entityType: "application", entityId: appRef,
  });

  await sendEmailNotifications({ recipients: cfg.emails, subject: cfg.title, body });
}
