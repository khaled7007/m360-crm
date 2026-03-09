"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Client } from "./stageConfig";
import { useStatusConfig } from "@/lib/status-config-context";

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);

const APP_STATUSES = [
  "draft", "submitted", "pre_approved", "documents_collected",
  "credit_assessment", "committee_review", "approved", "rejected", "disbursed",
] as const;

interface ClientCardProps {
  client: Client;
  index: number;
  isHighlighted: boolean;
  onClick: (client: Client) => void;
  onStatusChange: (clientId: string, newStatus: string) => void;
}

export function ClientCard({ client, index, isHighlighted, onClick, onStatusChange }: ClientCardProps) {
  const { statusConfig } = useStatusConfig();
  const statusCfg = statusConfig[client.status] ?? { label: client.status.replace(/_/g, " "), color: "#6B7280", bg: "#F3F4F6" };
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
          {/* Top row: status dropdown + date */}
          <div className="flex items-center justify-between mb-2.5">
            <select
              value={client.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                onStatusChange(client.id, e.target.value);
              }}
              className="text-xs font-semibold rounded-full border-0 outline-none cursor-pointer appearance-none px-2.5 py-0.5"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
            >
              {APP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusConfig[s]?.label || s}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-400">{client.updatedAt}</span>
          </div>

          {/* Name */}
          <h3 className="font-bold text-gray-800 text-sm leading-snug mb-0.5 truncate">
            {client.name}
          </h3>

          {/* Company / reference */}
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
