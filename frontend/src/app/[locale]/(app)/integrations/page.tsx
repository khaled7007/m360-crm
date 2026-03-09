"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  Building2,
  Fingerprint,
  User,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InputKind = "national_id" | "cr_number";

interface ServiceConfig {
  id: string;
  endpoint: (value: string) => string;
  inputKind: InputKind;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

// ─── Service definitions ───────────────────────────────────────────────────────

const SERVICES: ServiceConfig[] = [
  {
    id: "simah",
    endpoint: (v) => `/integrations/simah/${v}`,
    inputKind: "national_id",
    icon: <ShieldCheck size={22} />,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    id: "bayan",
    endpoint: (v) => `/integrations/bayan/${v}`,
    inputKind: "cr_number",
    icon: <Building2 size={22} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "nafath",
    endpoint: (v) => `/integrations/nafath/${v}`,
    inputKind: "national_id",
    icon: <Fingerprint size={22} />,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "yaqeen",
    endpoint: (v) => `/integrations/yaqeen/${v}`,
    inputKind: "national_id",
    icon: <User size={22} />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "watheq",
    endpoint: (v) => `/integrations/watheq/${v}`,
    inputKind: "cr_number",
    icon: <FileText size={22} />,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
];

// ─── Per-card state ────────────────────────────────────────────────────────────

interface CardState {
  inputValue: string;
  isLoading: boolean;
  result: unknown | null;
  error: string | null;
}

const makeDefault = (): CardState => ({
  inputValue: "",
  isLoading: false,
  result: null,
  error: null,
});

// ─── IntegrationCard ───────────────────────────────────────────────────────────

function IntegrationCard({
  service,
  state,
  onInputChange,
  onLookup,
}: {
  service: ServiceConfig;
  state: CardState;
  onInputChange: (value: string) => void;
  onLookup: () => void;
}) {
  const t = useTranslations("integrations");
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onLookup();
  };

  const serviceName = t(`services.${service.id}.name` as Parameters<typeof t>[0]);
  const serviceDescription = t(`services.${service.id}.description` as Parameters<typeof t>[0]);
  const inputLabel = service.inputKind === "national_id" ? t("nationalId") : t("crNumber");
  const inputPlaceholder = service.inputKind === "national_id" ? t("nationalIdPlaceholder") : t("crNumberPlaceholder");

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`${service.iconBg} ${service.iconColor} p-2.5 rounded-lg shrink-0`}>
          {service.icon}
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">{serviceName}</h3>
          <p className="text-sm text-stone-500 mt-0.5">{serviceDescription}</p>
        </div>
      </div>

      {/* Input + button */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-stone-600 mb-1">
            {inputLabel}
          </label>
          <input
            type="text"
            value={state.inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={state.isLoading}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onLookup}
            disabled={state.isLoading || !state.inputValue.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {state.isLoading ? t("lookingUp") : t("lookup")}
          </button>
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      {/* Result */}
      {state.result !== null && !state.error && (
        <div className="mt-1">
          <p className="text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
            {t("response")}
          </p>
          <pre className="text-xs bg-stone-50 border border-stone-200 rounded-lg p-3 overflow-x-auto max-h-56 overflow-y-auto whitespace-pre-wrap break-all text-stone-800">
            {JSON.stringify(state.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const t = useTranslations("integrations");
  const { token } = useAuth();

  const [cards, setCards] = useState<Record<string, CardState>>(
    () => Object.fromEntries(SERVICES.map((s) => [s.id, makeDefault()]))
  );

  const updateCard = (id: string, patch: Partial<CardState>) => {
    setCards((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleLookup = async (service: ServiceConfig) => {
    const state = cards[service.id];
    const value = state.inputValue.trim();

    const inputLabel = service.inputKind === "national_id" ? t("nationalId") : t("crNumber");
    if (!value) {
      toast.error(t("enterInput", { label: inputLabel }));
      return;
    }

    if (!token) {
      toast.error(t("loginRequired"));
      return;
    }

    updateCard(service.id, { isLoading: true, error: null, result: null });

    try {
      const result = await api<unknown>(service.endpoint(value), { token });
      const serviceName = t(`services.${service.id}.name` as Parameters<typeof t>[0]);
      updateCard(service.id, { result, isLoading: false });
      toast.success(t("lookupSuccess", { service: serviceName }));
    } catch (err) {
      const serviceName = t(`services.${service.id}.name` as Parameters<typeof t>[0]);
      const message = err instanceof Error ? err.message : t("lookupFailed");
      updateCard(service.id, { error: message, isLoading: false });
      toast.error(t("lookupError", { service: serviceName, message }));
    }
  };

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SERVICES.map((service) => (
          <IntegrationCard
            key={service.id}
            service={service}
            state={cards[service.id]}
            onInputChange={(value) => updateCard(service.id, { inputValue: value })}
            onLookup={() => handleLookup(service)}
          />
        ))}
      </div>
    </div>
  );
}
