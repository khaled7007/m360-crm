"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Client } from "./stageConfig";
import { ClientCard } from "./ClientCard";
import { usePipelineConfig } from "./pipeline-config-context";

const fmtCompact = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(n);

interface BoardProps {
  clients: Client[];
  onDragEnd: (result: DropResult) => void;
  onCardClick: (client: Client) => void;
  searchQuery: string;
}

export function Board({ clients, onDragEnd, onCardClick, searchQuery }: BoardProps) {
  const { config: { stages: STAGES } } = usePipelineConfig();
  const clientsByStage = STAGES.reduce<Record<string, Client[]>>((acc, stage) => {
    acc[stage.id] = clients.filter((c) => c.stage === stage.id);
    return acc;
  }, {});

  const isHighlighted = (client: Client) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    return (
      client.name.toLowerCase().includes(q) ||
      client.company.toLowerCase().includes(q) ||
      (client.assignee ?? "").toLowerCase().includes(q) ||
      (client.email ?? "").toLowerCase().includes(q)
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 280px)" }}>
        {STAGES.map((stage) => {
          const stageClients = clientsByStage[stage.id] ?? [];
          const stageValue = stageClients.reduce((s, c) => s + (c.value || 0), 0);

          return (
            <div key={stage.id} className="flex-shrink-0 w-72 flex flex-col">
              {/* Column header */}
              <div
                className="rounded-t-2xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: stage.headerBg }}
              >
                <div>
                  <div className="text-white font-bold text-sm">{stage.label}</div>
                  <div className="text-white text-xs opacity-70">{stage.labelEn}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {stageClients.length}
                  </span>
                  {stageClients.length > 0 && (
                    <span className="text-white text-xs opacity-75">{fmtCompact(stageValue)}</span>
                  )}
                </div>
              </div>

              {/* Drop zone */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 rounded-b-2xl p-2.5 transition-colors duration-200"
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? stage.border : stage.lightBg,
                      minHeight: "200px",
                    }}
                  >
                    {stageClients.map((client, index) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        index={index}
                        isHighlighted={isHighlighted(client)}
                        onClick={onCardClick}
                      />
                    ))}
                    {provided.placeholder}

                    {stageClients.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center h-24 opacity-40">
                        <div className="text-3xl mb-1">📭</div>
                        <div className="text-xs text-gray-500">لا يوجد عملاء</div>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
