"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Stage, StatusConfig, STAGES, STATUS_CONFIG } from "./stageConfig";

const STORAGE_KEY = "m360_pipeline_config";

interface PipelineConfig {
  stages: Stage[];
  statusConfig: Record<string, StatusConfig>;
}

function loadConfig(): PipelineConfig {
  if (typeof window === "undefined") return { stages: STAGES, statusConfig: STATUS_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PipelineConfig;
  } catch { /* ignore */ }
  return { stages: STAGES, statusConfig: STATUS_CONFIG };
}

function saveConfig(cfg: PipelineConfig) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

interface PipelineConfigContextValue {
  config: PipelineConfig;
  updateStage: (id: string, patch: Partial<Stage>) => void;
  updateStatus: (key: string, patch: Partial<StatusConfig>) => void;
  reset: () => void;
}

const PipelineConfigContext = createContext<PipelineConfigContextValue | null>(null);

export function PipelineConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PipelineConfig>(loadConfig);

  const update = useCallback((next: PipelineConfig) => {
    setConfig(next);
    saveConfig(next);
  }, []);

  const updateStage = useCallback((id: string, patch: Partial<Stage>) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        stages: prev.stages.map((s) => s.id === id ? { ...s, ...patch } : s),
      };
      saveConfig(next);
      return next;
    });
  }, []);

  const updateStatus = useCallback((key: string, patch: Partial<StatusConfig>) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        statusConfig: { ...prev.statusConfig, [key]: { ...prev.statusConfig[key], ...patch } },
      };
      saveConfig(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const defaults: PipelineConfig = { stages: STAGES, statusConfig: STATUS_CONFIG };
    update(defaults);
  }, [update]);

  return (
    <PipelineConfigContext.Provider value={{ config, updateStage, updateStatus, reset }}>
      {children}
    </PipelineConfigContext.Provider>
  );
}

export function usePipelineConfig() {
  const ctx = useContext(PipelineConfigContext);
  if (!ctx) throw new Error("usePipelineConfig must be used inside PipelineConfigProvider");
  return ctx;
}
