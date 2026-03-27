"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { Bell, BellOff, CheckCheck, Info, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  body?: string;
  message?: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  info:                  { icon: <Info size={16} />,          color: "text-teal-500" },
  warning:               { icon: <AlertTriangle size={16} />, color: "text-yellow-500" },
  action_required:       { icon: <Zap size={16} />,           color: "text-red-500" },
  application_submitted: { icon: <Info size={16} />,          color: "text-teal-500" },
  application_approved:  { icon: <Info size={16} />,          color: "text-green-600" },
  application_rejected:  { icon: <AlertTriangle size={16} />, color: "text-red-500" },
  committee_meeting:     { icon: <Zap size={16} />,           color: "text-purple-500" },
  overdue_alert:         { icon: <AlertTriangle size={16} />, color: "text-orange-500" },
  new_lead:              { icon: <Info size={16} />,          color: "text-teal-500" },
  facility_disbursed:           { icon: <Info size={16} />,          color: "text-green-600" },
  org_updated:                  { icon: <Info size={16} />,          color: "text-stone-500" },
  credit_assessment_requested:  { icon: <Zap size={16} />,           color: "text-orange-500" },
};

const fallbackTypeIcon = { icon: <Bell size={16} />, color: "text-stone-400" };

const formatRelativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const typeLabels: Record<string, string> = {
    info:                  t("typeLabels.info"),
    warning:               t("typeLabels.warning"),
    action_required:       t("typeLabels.action_required"),
    application_submitted: t("typeLabels.application_submitted"),
    application_approved:  t("typeLabels.application_approved"),
    application_rejected:  t("typeLabels.application_rejected"),
    committee_meeting:     t("typeLabels.committee_meeting"),
    overdue_alert:         t("typeLabels.overdue_alert"),
    new_lead:              t("typeLabels.new_lead"),
    facility_disbursed:           t("typeLabels.facility_disbursed"),
    org_updated:                  t("typeLabels.org_updated"),
    credit_assessment_requested:  t("typeLabels.credit_assessment_requested"),
  };

  const { data: notifications, isLoading, error: notificationsError, refetch } =
    useApiList<Notification>("/notifications");

  const { mutate: markReadAll, isSubmitting: isMarkingAll } =
    useApiMutation<Record<string, never>>("/notifications/read-all", "PUT");


  const handleMarkAllRead = async () => {
    try {
      await markReadAll({});
      toast.success(t("markAllSuccess"));
      refetch();
    } catch {
      toast.error(t("markAllError"));
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      // Use api directly to hit the correct path with the id interpolated
      const { api } = await import("@/lib/api");
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("m360_token") ?? ""
          : "";
      await api(`/notifications/${id}/read`, { method: "PUT", token });
      refetch();
    } catch {
      toast.error(t("markOneError"));
    }
  };

  const displayed =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              <CheckCheck size={16} />
              {isMarkingAll ? t("marking") : t("markAllRead")}
            </button>
          ) : null
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1 w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition capitalize ${
              filter === f
                ? "bg-teal-600 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {f === "unread" ? `${t("unreadCount")} (${unreadCount})` : tc("all")}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {notificationsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center text-stone-400">
          <div className="animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-2" />
          {t("loadingNotifications")}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
          <BellOff size={40} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500 text-sm">
            {t("noNotifications")}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 divide-y divide-stone-200 overflow-hidden">
          {displayed.map((notification) => {
            const config = typeIcons[notification.type] ?? fallbackTypeIcon;
            return (
              <div
                key={notification.id}
                className={`flex gap-4 px-5 py-4 transition hover:bg-stone-50 ${
                  !notification.is_read ? "bg-teal-50/40" : ""
                }`}
              >
                {/* Unread dot */}
                <div className="flex-shrink-0 mt-1">
                  {notification.is_read ? (
                    <Bell size={18} className="text-stone-300" />
                  ) : (
                    <div className="relative">
                      <Bell size={18} className="text-teal-500" />
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
                          {config.icon}
                          <span className="capitalize">{typeLabels[notification.type] ?? notification.type.replace(/_/g, " ")}</span>
                        </span>
                        <span className="text-xs text-stone-400">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          notification.is_read ? "text-stone-700" : "text-stone-900"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-stone-500 mt-0.5">
                        {notification.body ?? notification.message}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      <StatusBadge status={notification.type} />
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkOneRead(notification.id)}
                          className="text-xs text-teal-600 hover:text-teal-800 whitespace-nowrap"
                        >
                          {t("markRead")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
