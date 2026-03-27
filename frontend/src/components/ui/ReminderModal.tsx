"use client";

import { useState } from "react";
import { Bell, Clock, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useApiMutation } from "@/lib/use-api";
import { toast } from "sonner";

interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "lead" | "contact";
  entityId: string;
  entityName: string;
}

interface ReminderInput {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  due_at: string;
  note: string;
}

export function ReminderModal({ open, onClose, entityType, entityId, entityName }: ReminderModalProps) {
  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10);
  const defaultTime = "09:00";

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [note, setNote] = useState("");

  const { mutate: createReminder, isSubmitting } = useApiMutation<ReminderInput, unknown>("/reminders", "POST");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const due_at = new Date(`${date}T${time}:00`).toISOString();
    if (new Date(due_at) <= new Date()) {
      toast.error("يجب أن يكون وقت التذكير في المستقبل");
      return;
    }
    try {
      await createReminder({ entity_type: entityType, entity_id: entityId, entity_name: entityName, due_at, note });
      toast.success("تم حفظ التذكير بنجاح");
      setNote("");
      setDate(defaultDate);
      setTime(defaultTime);
      onClose();
    } catch {
      toast.error("فشل حفظ التذكير");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="إضافة تذكير" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Entity badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
          <Bell size={15} className="text-teal-600 shrink-0" />
          <span className="text-sm text-teal-800 font-medium truncate">{entityName}</span>
          <span className="text-xs text-teal-500 mr-auto shrink-0">
            {entityType === "lead" ? "عميل محتمل" : "جهة اتصال"}
          </span>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">التاريخ</label>
            <input
              type="date"
              value={date}
              min={defaultDate}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-1">
              <Clock size={13} />الوقت
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">ملاحظة (اختياري)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="سبب التذكير..."
            rows={2}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-stone-200">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition text-sm">
            إلغاء
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 text-sm">
            <Bell size={14} />
            {isSubmitting ? "جارٍ الحفظ..." : "حفظ التذكير"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface ReminderButtonProps {
  entityType: "lead" | "contact";
  entityId: string;
  entityName: string;
}

export function ReminderButton({ entityType, entityId, entityName }: ReminderButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded transition"
        title="إضافة تذكير"
      >
        <Bell size={14} />
      </button>
      <ReminderModal
        open={open}
        onClose={() => setOpen(false)}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
      />
    </>
  );
}
