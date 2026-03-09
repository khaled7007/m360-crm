"use client";

import { useState } from "react";
import { DropResult } from "@hello-pangea/dnd";
import { Search, Upload } from "lucide-react";
import { Board } from "@/components/pipeline/Board";
import { ClientDrawer } from "@/components/pipeline/ClientDrawer";
import { ImportModal } from "@/components/pipeline/ImportModal";
import { StatsBar } from "@/components/pipeline/StatsBar";
import { MOCK_CLIENTS } from "@/components/pipeline/mockClients";
import { Client } from "@/components/pipeline/stageConfig";

export default function PipelinePage() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    setClients((prev) =>
      prev.map((c) =>
        c.id === draggableId
          ? {
              ...c,
              stage: destination.droppableId,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : c
      )
    );
  };

  const handleImport = (newClients: Client[]) => {
    setClients((prev) => [...prev, ...newClients]);
  };

  const handleUpdate = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedClient(updated);
  };

  const matchCount = searchQuery.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.assignee ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      ).length
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">
      {/* Page header */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-stone-800">خط سير المبيعات</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            تتبع وإدارة العملاء عبر مراحل البيع
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="بحث عن عميل أو شركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-stone-200 rounded-xl pr-9 pl-4 py-2 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-stone-50"
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

        {/* Import button */}
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Upload size={15} />
          <span>استيراد Excel</span>
        </button>
      </div>

      {/* Search match banner */}
      {searchQuery.trim() && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 text-xs text-amber-700 flex items-center gap-2 flex-shrink-0">
          <Search size={13} />
          نتائج البحث عن:{" "}
          <span className="font-bold">&quot;{searchQuery}&quot;</span>
          {" — "}
          {matchCount} نتيجة
          {matchCount === 0 && " (بطاقات غير مطابقة خافتة)"}
        </div>
      )}

      {/* Scrollable board area */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <StatsBar clients={clients} />
        <Board
          clients={clients}
          onDragEnd={onDragEnd}
          onCardClick={setSelectedClient}
          searchQuery={searchQuery}
        />
      </div>

      {/* Client drawer */}
      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
