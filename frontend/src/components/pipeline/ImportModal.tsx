"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { Client, STAGE_MAP } from "./stageConfig";

const COLUMN_MAP: Record<string, keyof Client> = {
  "اسم العميل":       "name",
  "Client Name":      "name",
  "الاسم":            "name",
  "Name":             "name",
  "اسم الشركة":       "company",
  "Company":          "company",
  "الشركة":           "company",
  "الجوال":           "phone",
  "Phone":            "phone",
  "رقم الجوال":       "phone",
  "البريد":           "email",
  "البريد الإلكتروني":"email",
  "Email":            "email",
  "قيمة الصفقة":      "value",
  "Deal Value":       "value",
  "القيمة":           "value",
  "Value":            "value",
  "المرحلة":          "stage",
  "Stage":            "stage",
  "المسؤول":          "assignee",
  "Assignee":         "assignee",
  "المسؤول عن العميل":"assignee",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);

const STAGE_LABELS: Record<string, string> = {
  new: "جديد", lead: "عميل محتمل", interested: "مهتم", deal: "صفقة", reject: "مرفوض",
};

interface ImportModalProps {
  onClose: () => void;
  onImport: (clients: Client[]) => void;
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [rows, setRows] = useState<Client[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setError("يُرجى اختيار ملف Excel بصيغة .xlsx أو .xls فقط.");
      return;
    }
    setError("");
    setFileName(file.name);

    const XLSX = await import("xlsx");
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target!.result as string, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][];

        if (raw.length < 2) {
          setError("الملف فارغ أو لا يحتوي على بيانات كافية.");
          return;
        }

        const headers = raw[0] as string[];
        const parsed: Client[] = raw
          .slice(1)
          .filter((row) => (row as unknown[]).some((c) => c !== undefined && c !== ""))
          .map((row, i) => {
            const obj: Partial<Client> & { id: string } = {
              id: `import-${Date.now()}-${i}`,
              status: "cold",
              notes: "",
              updatedAt: new Date().toISOString().split("T")[0],
              value: 0,
              stage: "new",
            };
            headers.forEach((h, idx) => {
              const field = COLUMN_MAP[String(h).trim()];
              if (field) {
                let val: unknown = (row as unknown[])[idx] ?? "";
                if (field === "value")
                  val = Number(String(val).replace(/[^0-9.]/g, "")) || 0;
                if (field === "stage")
                  val = STAGE_MAP[String(val).trim()] ?? "new";
                (obj as Record<string, unknown>)[field] = val;
              }
            });
            if (!obj.name) obj.name = `عميل ${i + 1}`;
            return obj as Client;
          });

        setRows(parsed);
      } catch {
        setError("تعذّر قراءة الملف. تأكد أنه ملف Excel صالح.");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-800">استيراد من Excel</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                يدعم الأعمدة باللغتين العربية والإنجليزية
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Drop zone */}
            <div
              className={[
                "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
                dragging
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-200 hover:border-teal-300 hover:bg-gray-50",
              ].join(" ")}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
            >
              <div className="text-5xl mb-3">📊</div>
              {fileName ? (
                <>
                  <div className="font-semibold text-gray-700">{fileName}</div>
                  <div className="text-sm text-teal-500 mt-1">انقر لاستبدال الملف</div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-gray-600">
                    اسحب الملف هنا أو انقر للاختيار
                  </div>
                  <div className="text-sm text-gray-400 mt-1">يدعم .xlsx و .xls</div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* Column hints */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                الأعمدة المدعومة في ملف Excel:
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  ["اسم العميل / Client Name", "الاسم"],
                  ["اسم الشركة / Company", "الشركة"],
                  ["الجوال / Phone", "الجوال"],
                  ["البريد / Email", "البريد"],
                  ["قيمة الصفقة / Deal Value", "القيمة"],
                  ["المرحلة / Stage", "المرحلة"],
                  ["المسؤول / Assignee", "المسؤول"],
                ].map(([col, field]) => (
                  <div key={col} className="flex items-center gap-2 text-xs text-blue-600">
                    <span className="font-medium">{col}</span>
                    <span className="text-blue-400">←</span>
                    <span>{field}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Preview table */}
            {rows.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ تم العثور على {rows.length} سجل
                  </span>
                  <span className="text-xs text-gray-500">
                    المراحل غير المعروفة ستُضاف إلى «جديد» تلقائياً
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        {["#", "الاسم", "الشركة", "الجوال", "القيمة", "المرحلة", "المسؤول"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-3 py-2.5 text-right font-semibold border-b border-gray-200"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                          <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                          <td className="px-3 py-2 text-gray-500">{row.company || "—"}</td>
                          <td className="px-3 py-2 text-gray-500" dir="ltr">{row.phone || "—"}</td>
                          <td className="px-3 py-2 font-medium text-gray-700">{fmt(row.value)}</td>
                          <td className="px-3 py-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {STAGE_LABELS[row.stage] ?? row.stage}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-500">{row.assignee || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-start flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
            >
              إلغاء
            </button>
            {rows.length > 0 && (
              <button
                onClick={() => { onImport(rows); onClose(); }}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors text-sm font-semibold"
              >
                استيراد {rows.length} عميل
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
