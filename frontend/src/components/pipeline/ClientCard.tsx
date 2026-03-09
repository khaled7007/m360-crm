"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Client } from "./stageConfig";
import { usePipelineConfig } from "./pipeline-config-context";

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);

interface ClientCardProps {
  client: Client;
  index: number;
  isHighlighted: boolean;
  onClick: (client: Client) => void;
}

export function ClientCard({ client, index, isHighlighted, onClick }: ClientCardProps) {
  const { config: { statusConfig } } = usePipelineConfig();
  const statusCfg = statusConfig[client.status] ?? statusConfig["cold"] ?? { label: client.status, color: "#6B7280", bg: "#F3F4F6" };
  const initials = client.assignee ? client.assignee.slice(0, 1) : "؟";

  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(client)}
          className={[
            "bg-white rounded-xl p-3.5 mb-2.5 border cursor-pointer select-none",
            "transition-all duration-150",
            snapshot.isDragging
              ? "shadow-2xl scale-105 rotate-1 opacity-95 border-indigo-300"
              : "shadow-sm hover:shadow-md border-gray-100 hover:border-gray-200",
            isHighlighted ? "ring-2 ring-yellow-400 border-yellow-300" : "",
          ].join(" ")}
        >
          {/* Top row */}
          <div className="flex items-center justify-between mb-2.5">
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
            >
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-400">{client.updatedAt}</span>
          </div>

          {/* Name */}
          <h3 className="font-bold text-gray-800 text-sm leading-snug mb-0.5 truncate">
            {client.name}
          </h3>

          {/* Company */}
          <p className="text-xs text-gray-500 mb-3 truncate">{client.company}</p>

          <div className="border-t border-gray-50 mb-2.5" />

          {/* Value */}
          <div className="text-sm font-bold text-gray-800 mb-2.5">{fmt(client.value)}</div>

          {/* Assignee */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 flex-shrink-0">
              {initials}
            </div>
            <span className="text-xs text-gray-500 truncate">{client.assignee || "—"}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
