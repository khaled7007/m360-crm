"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface StatusCfg {
  label: string;
  color: string;   // text color (hex)
  bg: string;      // background color (hex)
}

export const DEFAULT_STATUS_CONFIG: Record<string, StatusCfg> = {
  draft:               { label: "مسودة",          color: "#6B7280", bg: "#F3F4F6" },
  submitted:           { label: "مقدّم",           color: "#0D9488", bg: "#CCFBF1" },
  pre_approved:        { label: "موافقة مبدئية",  color: "#7C3AED", bg: "#EDE9FE" },
  documents_collected: { label: "وثائق مكتملة",  color: "#1D4ED8", bg: "#DBEAFE" },
  credit_assessment:   { label: "تقييم ائتماني", color: "#EA580C", bg: "#FFEDD5" },
  committee_review:    { label: "مراجعة اللجنة", color: "#9333EA", bg: "#F3E8FF" },
  approved:            { label: "معتمد",          color: "#059669", bg: "#ECFDF5" },
  rejected:            { label: "مرفوض",          color: "#DC2626", bg: "#FEF2F2" },
  disbursed:           { label: "صُرف التمويل",  color: "#0F766E", bg: "#D1FAE5" },
};

const STORAGE_KEY = "m360_status_config";

function load(): Record<string, StatusCfg> {
  if (typeof window === "undefined") return DEFAULT_STATUS_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATUS_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_STATUS_CONFIG;
}

function save(cfg: Record<string, StatusCfg>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

interface StatusConfigCtx {
  statusConfig: Record<string, StatusCfg>;
  updateStatus: (key: string, patch: Partial<StatusCfg>) => void;
  reset: () => void;
}

const Ctx = createContext<StatusConfigCtx | null>(null);

export function StatusConfigProvider({ children }: { children: ReactNode }) {
  const [statusConfig, setStatusConfig] = useState<Record<string, StatusCfg>>(load);

  const updateStatus = useCallback((key: string, patch: Partial<StatusCfg>) => {
    setStatusConfig((prev) => {
      const next = { ...prev, [key]: { ...prev[key], ...patch } };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setStatusConfig(DEFAULT_STATUS_CONFIG);
    save(DEFAULT_STATUS_CONFIG);
  }, []);

  return <Ctx.Provider value={{ statusConfig, updateStatus, reset }}>{children}</Ctx.Provider>;
}

export function useStatusConfig() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStatusConfig must be inside StatusConfigProvider");
  return ctx;
}
