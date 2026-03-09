"use client";

import { useState, useMemo } from "react";
import { DropResult } from "@hello-pangea/dnd";
import { Search, Settings2 } from "lucide-react";
import { Board } from "@/components/pipeline/Board";
import { ClientDrawer } from "@/components/pipeline/ClientDrawer";
import { StatsBar } from "@/components/pipeline/StatsBar";
import { PipelineSettingsModal } from "@/components/pipeline/PipelineSettingsModal";
import { PipelineConfigProvider } from "@/components/pipeline/pipeline-config-context";
import { Client } from "@/components/pipeline/stageConfig";
import { useApiList } from "@/lib/use-api";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Application {
  id: string;
  reference_number: string;
  organization_id: string;
  product_id: string;
  requested_amount: number;
  purpose: string;
  pipeline_stage?: string;
  status: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name_ar: string;
  name_en: string;
}

function appToClient(app: Application, orgsById: Record<string, Organization>): Client {
  const org = orgsById[app.organization_id];
  return {
    id: app.id,
    name: org?.name_ar || org?.name_en || app.organization_id,
    company: app.reference_number,
    phone: "",
    email: "",
    value: app.requested_amount,
    stage: app.pipeline_stage || "new",
    assignee: "",
    status: app.status,
    notes: app.purpose || "",
    updatedAt: app.updated_at?.split("T")[0] ?? "",
  };
}

export default function PipelinePage() {
  return (
    <PipelineConfigProvider>
      <PipelineBoard />
    </PipelineConfigProvider>
  );
}

function PipelineBoard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  // local override of pipeline_stage while waiting for re-fetch
  const [stageOverrides, setStageOverrides] = useState<Record<string, string>>({});

  const {
    data: applications,
    isLoading,
    refetch,
  } = useApiList<Application>("/applications", { limit: 200 });

  const { data: organizations } = useApiList<Organization>("/organizations", { limit: 200 });

  const orgsById = useMemo(() => {
    const map: Record<string, Organization> = {};
    organizations.forEach((o) => { map[o.id] = o; });
    return map;
  }, [organizations]);

  const clients = useMemo(() =>
    applications.map((app) => {
      const c = appToClient(app, orgsById);
      if (stageOverrides[app.id]) c.stage = stageOverrides[app.id];
      return c;
    }),
    [applications, orgsById, stageOverrides]
  );

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId;
    setStageOverrides((prev) => ({ ...prev, [draggableId]: newStage }));

    try {
      const token = localStorage.getItem("m360_token") || "";
      await api(`/applications/${draggableId}`, {
        method: "PUT",
        body: { pipeline_stage: newStage },
        token,
      });
      refetch();
    } catch {
      toast.error("فشل تحديث المرحلة");
      setStageOverrides((prev) => {
        const next = { ...prev };
        delete next[draggableId];
        return next;
      });
    }
  };

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("m360_token") || "";
      await api(`/applications/${clientId}`, {
        method: "PUT",
        body: { status: newStatus },
        token,
      });
      refetch();
    } catch {
      toast.error("فشل تحديث الحالة");
    }
  };

  const handleUpdate = async (updated: Client) => {
    try {
      const token = localStorage.getItem("m360_token") || "";
      await api(`/applications/${updated.id}`, {
        method: "PUT",
        body: { purpose: updated.notes },
        token,
      });
      refetch();
      setSelectedClient(updated);
    } catch {
      toast.error("فشل حفظ الملاحظات");
    }
  };

  const matchCount = searchQuery.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company.toLowerCase().includes(searchQuery.toLowerCase())
      ).length
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">
      {/* Page header */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-stone-800">خط سير المبيعات</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            تتبع وإدارة الطلبات عبر مراحل البيع
          </p>
        </div>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 transition text-stone-500"
          title="إعدادات خط سير المبيعات"
        >
          <Settings2 size={18} />
        </button>

        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="بحث عن منظمة أو رقم طلب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-stone-200 rounded-xl pr-9 pl-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-stone-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 -translate-y-1/2 left-3 text-stone-400 hover:text-stone-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Search match banner */}
      {searchQuery.trim() && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 text-xs text-amber-700 flex items-center gap-2 flex-shrink-0">
          <Search size={13} />
          نتائج البحث عن:{" "}
          <span className="font-bold">&quot;{searchQuery}&quot;</span>
          {" — "}
          {matchCount} نتيجة
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}

      {/* Scrollable board area */}
      {!isLoading && (
        <div className="flex-1 overflow-auto px-6 py-5">
          <StatsBar clients={clients} />
          <Board
            clients={clients}
            onDragEnd={onDragEnd}
            onCardClick={setSelectedClient}
            onStatusChange={handleStatusChange}
            searchQuery={searchQuery}
          />
        </div>
      )}

      {/* Client drawer */}
      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <PipelineSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
